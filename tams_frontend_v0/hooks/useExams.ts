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
  const fallbackName = [e.subject, e.examType || e.exam_type, e.date]
    .filter(Boolean)
    .join(" • ");
  return {
    ...e,
    id: String(e.id ?? ""),
    batchId: String(e.batchId ?? e.batch_id ?? ""),
    groupId: e.groupId ? String(e.groupId) : e.group_id ? String(e.group_id) : undefined,
    name: e.name || fallbackName || "Exam",
    type: e.type || e.examType || e.exam_type,
    examDate: e.examDate || e.date,
    maxMarks: Number(e.maxMarks ?? e.max_marks ?? 0),
    passingMarks: Number(e.passingMarks ?? e.passing_marks ?? 0),
    isLocked: Boolean(e.isLocked ?? e.is_locked),
    batch: e.batchName || e.batch_name
      ? {
          id: String(e.batchId ?? e.batch_id ?? ""),
          name: String(e.batchName ?? e.batch_name),
        }
      : undefined,
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
    queryFn: async () => {
      const data = (await api.get(`/exams/${examId}/results`)) as Array<Record<string, unknown>>
      return data.map((result) => ({
        ...result,
        id: String(result.id ?? ''),
        examId: String(result.examId ?? result.exam_id ?? examId),
        studentId: String(result.studentId ?? result.student_id ?? ''),
        marksObtained:
          result.marksObtained == null && result.marks_obtained == null
            ? null
            : Number(result.marksObtained ?? result.marks_obtained ?? 0),
        isAbsent: Boolean(result.isAbsent ?? result.is_absent),
      })) as ExamResult[]
    },
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
