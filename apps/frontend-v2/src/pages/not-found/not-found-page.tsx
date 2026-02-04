import { ArrowLeft, Home } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function NotFoundPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h1 className="text-9xl font-bold text-muted-foreground/20">404</h1>
            <h2 className="text-3xl font-bold mt-4">Page Not Found</h2>
            <p className="text-muted-foreground mt-2 max-w-md">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <div className="flex gap-4 mt-8">
                <Button variant="outline" asChild>
                    <Link to="/">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Go Back
                    </Link>
                </Button>
                <Button asChild>
                    <Link to="/">
                        <Home className="h-4 w-4 mr-2" />
                        Home
                    </Link>
                </Button>
            </div>
        </div>
    );
}
