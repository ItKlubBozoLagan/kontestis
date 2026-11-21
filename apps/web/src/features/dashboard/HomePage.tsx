import { useCurrentUser } from "@/api/auth";
import { TemporaryHomePage } from "@/features/contests/TemporaryHomePage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";

/** `/` is the dashboard, or the contest list for temporary (contest-locked) accounts. */
export const HomePage = () => {
    const user = useCurrentUser();

    return user.is_temporary ? <TemporaryHomePage /> : <DashboardPage />;
};
