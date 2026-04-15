import { useQuery } from "@tanstack/react-query";
import { fetchQuestions } from "@/lib/api";

export function useQuestions() {
  return useQuery({
    queryKey: ["questions"],
    queryFn: fetchQuestions,
    staleTime: Infinity,
  });
}
