// import { usersData } from "../data/mockUsers"; // commented out: replaced with dynamic fetch
// const filteredUsers = useContributorFilters(usersData, filters); // commented out: replaced with dynamic fetch
// const totalContributors = usersData.length; // commented out: replaced with dynamic fetch
// const activeContributors = usersData.filter((user) => user.isActive).length; // commented out: replaced with dynamic fetch
// const averageXP = Math.round(
//   usersData.reduce((sum, user) => sum + user.xp, 0) / totalContributors
// ); // commented out: replaced with dynamic fetch
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserProvider";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { User, DashboardFilters } from "../types";
import { useContributorFilters } from "../hooks/useContributorFilters";
import { StatsCards } from "../components/StatsCards";
import { SearchAndFilters } from "../components/SearchAndFilters";
import { ContributorsTable } from "../components/ContributorsTable";
import { UserProfileModal } from "../components/UserProfileModal";

export default function CompanyDashboard() {
  const { logout } = useUser();
  useEffect(() => {
    async function fetchContributors() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_GITHUB_API_URL || "https://innerve-x-github-workflow-be-xi.vercel.app"}/api/contributors`,
        );
        if (!res.ok) throw new Error("Failed to fetch contributors");
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setUsers([]);
      }
    }
    fetchContributors();
  }, []);
  const [filters, setFilters] = useState<DashboardFilters>({
    searchTerm: "",
    sortOrder: "desc",
    rankFilter: "all",
    statusFilter: "all",
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const filteredUsers = useContributorFilters(users, filters);

  const handleFiltersChange = (newFilters: Partial<DashboardFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
  };

  // Calculate stats
  const totalContributors = users.length;
  const activeContributors = users.filter((user) => user.isActive).length;
  const averageXP =
    users.length > 0
      ? Math.round(users.reduce((sum, user) => sum + user.xp, 0) / users.length)
      : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            PullQuest <span style={{ color: "#F7E7CE" }}>Hire</span>
          </h1>
          <p className="text-muted-foreground">
            Discover and connect with top open source contributors
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="w-4 h-4 mr-1" />
          Logout
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsCards
        totalContributors={totalContributors}
        activeContributors={activeContributors}
        averageXP={averageXP}
      />

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Contributor Directory</CardTitle>
          <CardDescription>
            Browse and discover talented developers based on their contributions
            and expertise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SearchAndFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />

          <ContributorsTable
            users={filteredUsers}
            onUserSelect={handleUserSelect}
          />

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredUsers.length} of {totalContributors} contributors
            </p>
          </div>
        </CardContent>
      </Card>

      {/* User Profile Modal */}
      <UserProfileModal
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={handleCloseModal}
      />
    </div>
  );
}
