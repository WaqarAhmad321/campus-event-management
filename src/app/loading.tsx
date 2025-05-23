
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-15rem)]">
      <LoadingSpinner size="lg" />
    </div>
  );
}
