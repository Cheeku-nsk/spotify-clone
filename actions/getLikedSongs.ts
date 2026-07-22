import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { Song } from "@/types";

const getLikedSongs = async (): Promise<Song[]> => {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // No-op
        },
        remove() {
          // No-op
        },
      },
    }
  );

  const {
    data: {
        user
    }
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('liked_songs')
    .select('*, songs(*)')
    .eq('user_id', user?.id) 
    .order('created_at', { ascending: false });

  if (error) {
    console.log(error)
    return [];
  }

  if (!data) {
    return [];
  }

  return data.map((item)=>({
    ...item.songs
  }));
};

export default getLikedSongs;