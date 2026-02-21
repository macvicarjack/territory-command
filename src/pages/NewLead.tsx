import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOutcome } from "@/lib/api";
import { ArrowLeft, Crosshair } from "lucide-react";
import { toast } from "sonner";

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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex items-center gap-3 py-4">
          <Link
            to="/"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
        </div>
      </header>

      <main className="container max-w-lg py-8">
        <div className="mb-6 flex items-center gap-3">
          <Crosshair className="h-6 w-6 text-primary" />
          <h1 className="font-mono text-lg font-bold uppercase tracking-wider text-foreground">
            New Lead
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Acme Corp"
              className="w-full rounded-lg border border-input bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              The Goal
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Close Q2 Enterprise Deal — $150K"
              className="w-full rounded-lg border border-input bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              First Task
            </label>
            <input
              type="text"
              value={firstTask}
              onChange={(e) => setFirstTask(e.target.value)}
              placeholder="Send intro email to decision maker"
              className="w-full rounded-lg border border-input bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
      </main>
    </div>
  );
}
