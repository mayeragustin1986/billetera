import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { supabase, TABLES } from "../services/supabase";

function useEntity(table, keyName) {
  const { user } = useAuth();
  const client = useQueryClient();
  const key = [keyName, user?.id];
  const query = useQuery({
    queryKey: key,
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase.schema("public").from(table).select("*").order("active", { ascending: false }).order("sort_order").order("name");
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => client.invalidateQueries({ queryKey: key });
  const create = useMutation({
    mutationFn: async (values) => {
      const { data, error } = await supabase.schema("public").from(table).insert({ ...values, user_id: user.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: async ({ id, ...values }) => {
      const { data, error } = await supabase.schema("public").from(table).update(values).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: async (id) => {
      const { error, count } = await supabase.schema("public").from(table).delete({ count: "exact" }).eq("id", id);
      if (error) throw error;
      if (count === 0) throw new Error("Está en uso. Podés desactivarlo.");
    },
    onSuccess: refresh,
  });
  return { ...query, create, update, remove };
}

export const useFinancialSpaces = () => useEntity(TABLES.financialSpaces, "financial-spaces");
export const useAccounts = () => useEntity(TABLES.accounts, "accounts");
