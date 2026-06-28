"use client";
import { Database } from "@/types_db";

import { createBrowserClient } from "@supabase/ssr";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

interface SupabaseProviderProps {
    children: ReactNode;
}

type SupabaseContextType = {
    supabase: SupabaseClient<Database>;
};

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const useSupabase = () => {
    const context = useContext(SupabaseContext);

    if (context === undefined) {
        throw new Error("useSupabase must be used within a SupabaseProvider");
    }

    return context.supabase;
};


const SupabaseProvider: React.FC<SupabaseProviderProps> = ({
    children,
}) => {
    const [supabase] = useState(() =>
        createBrowserClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    );

    return (
        <SupabaseContext.Provider value={{ supabase }}>
            {children}
        </SupabaseContext.Provider>
    )
}

export default SupabaseProvider;