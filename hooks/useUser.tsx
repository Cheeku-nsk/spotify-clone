"use client";

import { Subscription, UserDetails } from "@/types";
import { useSupabase } from "@/providers/SupabaseProvider";

import { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type UserContextType = {
    accessToken: string | null;
    user: User | null;
    userDetails: UserDetails | null;
    isLoading: boolean;
    subscription: Subscription | null;
};

export const UserContext = createContext<UserContextType | undefined>(undefined);

type Props = {
    children: ReactNode;
};

export const MyUserContextProvider = ({ children }: Props) => {
    const supabase = useSupabase();
    const [session, setSession] = useState<Session | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);

    const user = session?.user ?? null;
    const accessToken = session?.access_token ?? null;
    const userId = user?.id ?? null;
    const resolvedUserDetails = userId === loadedUserId ? userDetails : null;
    const resolvedSubscription = userId === loadedUserId ? subscription : null;
    const isLoadingData = Boolean(userId) && loadedUserId !== userId;

    useEffect(() => {
        let isMounted = true;

        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            if (isMounted) {
                setSession(currentSession);
                setIsLoadingAuth(false);
            }
        });

        const { data: authState } = supabase.auth.onAuthStateChange((_, nextSession) => {
            setSession(nextSession);
            setIsLoadingAuth(false);
        });

        return () => {
            isMounted = false;
            authState.subscription.unsubscribe();
        };
    }, [supabase]);

    useEffect(() => {
        if (!userId) {
            return;
        }

        let isCancelled = false;

        const loadUserData = async () => {
            try {
                const [userDetailsResult, subscriptionResult] = await Promise.all([
                    supabase.from("users").select("*").eq("id", userId).maybeSingle(),
                    supabase
                        .from("subscriptions")
                        .select("*, prices(*,products(*))")
                        .eq("user_id", userId)
                        .in("status", ["trialing", "active"])
                        .maybeSingle(),
                ]);

                if (isCancelled) {
                    return;
                }

                setUserDetails((userDetailsResult.data ?? null) as UserDetails | null);
                setSubscription((subscriptionResult.data ?? null) as Subscription | null);
            } catch {
                if (!isCancelled) {
                    setUserDetails(null);
                    setSubscription(null);
                }
            } finally {
                if (!isCancelled) {
                    setLoadedUserId(userId);
                }
            }
        };

        void loadUserData();

        return () => {
            isCancelled = true;
        };
    }, [supabase, userId]);

    const value = useMemo(
        () => ({
            accessToken,
            user,
            userDetails: resolvedUserDetails,
            isLoading: isLoadingAuth || isLoadingData,
            subscription: resolvedSubscription,
        }),
        [accessToken, user, resolvedUserDetails, isLoadingAuth, isLoadingData, resolvedSubscription]
    );

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
    const context = useContext(UserContext);

    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }

    return context;
};
