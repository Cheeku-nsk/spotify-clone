"use client";

import { useRouter } from "next/navigation";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { useSupabase } from "@/providers/SupabaseProvider";
import Modal from "./Modal";
import useAuthModal from "@/hooks/useAuthModal";

const AuthModal = () => {
  const supabase = useSupabase();
  const router = useRouter();
  const { onClose, isOpen } = useAuthModal();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (isMounted) {
        setSession(currentSession);
      }
    });

    const { data: authState } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      authState.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (session) {
      router.refresh();
      onClose();
    }
  }, [session, router, onClose]);

  

  const onChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  }

  return (

    <Modal
        title="Welcome Back!"
        description="Login to your account"
        isOpen={isOpen}
        onChange={onChange}
    >
        <Auth 
          theme="dark"
          providers={["github"]}
          magicLink
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables:{
              default:{
                colors:{
                  brand:'#404040',
                  brandAccent:'#22c55e',
                }
              }
            }
          }}
        />
    </Modal>
  )
}

export default AuthModal