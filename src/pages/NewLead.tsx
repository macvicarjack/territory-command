import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOutcome } from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function NewLead() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [customerName, setCustomerName] = useState("");
  const [title, setTitle] = useState("");
  const [firstTask, setFirstTask] = useState("");

  const mutation = useMutation({
    mutationFn: createOutcome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outcomes"] });
      toast.success("Lead created");
      navigate("/");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim() || !title.trim() || !firstTask.trim()) return;
    mutation.mutate({
      customer_name: customerName.trim(),
      title: title.trim(),
      first_task: firstTask.trim(),
    });
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="mx-auto max-w-lg">
          <h1 className="mb-6 text-xl font-bold text-foreground">New Lead</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Acme Corp"
                className="w-full rounded-lg bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                The Goal
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Close Q2 Enterprise Deal — $150K"
                className="w-full rounded-lg bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                First Task
              </label>
              <input
                type="text"
                value={firstTask}
                onChange={(e) => setFirstTask(e.target.value)}
                placeholder="Send intro email to decision maker"
                className="w-full rounded-lg bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <button
              type="submit"
              disabled={!customerName.trim() || !title.trim() || !firstTask.trim() || mutation.isPending}
              className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {mutation.isPending ? "Creating..." : "Create Lead"}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
