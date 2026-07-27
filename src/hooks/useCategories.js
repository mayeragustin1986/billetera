import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../services/supabase";

export function useCategories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = ["categories", user?.id];

  const query = useQuery({
    queryKey: key,
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: key });
  const create = useMutation({
    mutationFn: async (values) => {
      const { data, error } = await supabase
        .from("categories")
        .insert({ ...values, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: async ({ id, ...values }) => {
      const { data, error } = await supabase
        .from("categories")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  return { ...query, create, update, remove };
}
