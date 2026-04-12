"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import {
  Exam,
  ExamFormData,
  ExamFilters,
  ExamResult,
  MarksEntryPayload,
  Subject,
} from "@/lib/types";
import { getPdfUrl } from "@/lib/utils";

export const examKeys = {
  lists: (filters?: ExamFilters) => ["exams", "list", filters] as const,
  subjects: (batchId?: string) => ["subjects", batchId] as const,
  results: (examId: string) => ["exams", "results", examId] as const,
};

const transformExam = (e: any): Exam => {
  if (!e) return e;
  return {
    ...e,
    type: e.type || e.examType || e.exam_type,
    examDate: e.examDate || e.date,
  };
};

export function useExams(
  filters?: ExamFilters,
  options?: { enabled?: boolean },
) {
  const params: Record<string, string> = {};
  if (filters?.batchId) params.batch_id = filters.batchId;
  if (filters?.type && filters.type !== "all") params.exam_type = filters.type;
  if (filters?.month) params.month = filters.month;

  return useQuery<Exam[]>({
    queryKey: examKeys.lists(filters),
    queryFn: async () => {
      const data = (await api.get("/exams", { params })) as any[];
      return data.map(transformExam);
    },
    enabled: options?.enabled !== false,
  });
}

export function useSubjects(batchId?: string) {
  return useQuery<Subject[]>({
    queryKey: examKeys.subjects(batchId),
    queryFn: () =>
      api.get("/subjects", {
        params: batchId ? { batch_id: batchId } : {},
      }) as Promise<Subject[]>,
  });
}

export function useExamResults(examId: string) {
  return useQuery<ExamResult[]>({
    queryKey: examKeys.results(examId),
    queryFn: () => api.get(`/exams/${examId}/results`) as Promise<ExamResult[]>,
    enabled: !!examId,
  });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ExamFormData) => {
      // Map frontend fields to backend-expected field names
      const payload = {
        batch_id: data.batchId,
        group_id: data.groupId,
        subject: data.subject,
        exam_type: data.type,
        date: data.examDate,
        max_marks: data.maxMarks,
        passing_marks: data.passingMarks,
        name: data.name,
      };
      return api.post("/exams", payload) as Promise<Exam>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Exam created successfully");
    },
  });
}

export function useSaveResults() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      examId,
      results,
    }: {
      examId: string;
      results: MarksEntryPayload[];
    }) =>
      api.post(`/exams/${examId}/results`, { results }) as Promise<
        ExamResult[]
      >,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: examKeys.results(variables.examId) });
      qc.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Results saved successfully");
    },
  });
}

export function useLockExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (examId: string) =>
      api.patch(`/exams/${examId}/lock`) as Promise<Exam>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Exam locked");
    },
  });
}

export function useGenerateReportCard() {
  return useMutation({
    mutationFn: ({ studentId, month }: { studentId: string; month: string }) =>
      api.get(`/exams/report/${studentId}/${month}`) as Promise<{
        path: string;
      }>,
    onSuccess: (data) => {
      if (data?.path) {
        window.open(getPdfUrl(data.path), "_blank");
      }
    },
  });
}
export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/exams/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Exam deleted successfully");
    },
  });
}
