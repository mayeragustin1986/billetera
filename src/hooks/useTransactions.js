import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, TABLES } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";

export function useTransactions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = ["transactions", user?.id];

  const query = useQuery({
    queryKey: key,
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase.schema("public").from(TABLES.transactions).select("*").order("occurred_at", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: key });
  const create = useMutation({
    mutationFn: async (values) => {
      const { data, error } = await supabase.schema("public").from(TABLES.transactions).insert({ ...values, user_id: user.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: async ({ id, ...values }) => {
      const { data, error } = await supabase.schema("public").from(TABLES.transactions).update(values).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.schema("public").from(TABLES.transactions).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  return { ...query, create, update, remove };
}
