
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function HomeHero() {
  return (
    <div className="relative isolate px-6 pt-14 lg:px-8">
      <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Leave Management Made Simple
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Streamline your leave requests, approvals, and tracking. Manage time off efficiently with our comprehensive leave management solution.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link to="/login">Login to Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/about">Learn more</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
