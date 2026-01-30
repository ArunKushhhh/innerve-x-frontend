"use client";

import { useState, useEffect } from "react";
import { useUser } from "../context/UserProvider";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Coins,
  Trophy,
  TrendingUp,
  Star,
  Github,
  Settings,
  Search,
  Plus,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ExternalLink,
  User,
  LogOut,
  GitFork,
  Lock,
  Unlock,
  Code2,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface UserStats {
  coins: number;
  xp: number;
  rank: string;
  nextRankXP: number;
  repositories: number;
  mergedPRs: number;
  activeBounties: number;
}

interface UserProfile {
  id: string;
  login: string;
  name: string;
  email: string;
  bio: string;
  location: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
}

interface SuggestedIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  repository: {
    name: string;
    fullName: string;
    htmlUrl: string;
    stargazersCount: number;
    language: string;
  };
  labels: Array<{
    name: string;
    color: string;
  }>;
  difficulty: "beginner" | "intermediate" | "advanced";
  bounty: number;
  xpReward: number;
  stakingRequired: number;
  htmlUrl: string;
  createdAt: string;
}

interface Stake {
  _id: string;
  issueId: number;
  repository: string;
  amount: number;
  status: "pending" | "accepted" | "rejected" | "expired";
  prUrl: string;
  xpEarned?: number;
  coinsEarned?: number;
  createdAt: string;
}

interface AnalyzedRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
  openIssuesCount: number;
  topics: string[];
  isPrivate: boolean;
  isFork: boolean;
  updatedAt: string;
  pushedAt: string;
  hasIssues: boolean;
  isContributable: boolean;
}

export default function ContributorDashboard() {
  const { user, isLoading: userLoading, logout } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "overview" | "issues" | "stakes" | "repositories"
  >("overview");
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [suggestedIssues, setSuggestedIssues] = useState<SuggestedIssue[]>([]);
  const [userStakes, setUserStakes] = useState<Stake[]>([]);
  const [analyzedRepos, setAnalyzedRepos] = useState<AnalyzedRepo[]>([]);
  const [repoStats, setRepoStats] = useState<{
    total: number;
    contributable: number;
    languages: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzingRepos, setAnalyzingRepos] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchUserStakes();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const accessToken = user?.accessToken;

      if (!accessToken) {
        toast.error("Authentication required");
        return;
      }

      const response = await axios.post(
        `${API_BASE}/api/contributor/profile`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (response.data.success) {
        const profile = response.data.data.profile;
        const stats = response.data.data.stats;
        setUserProfile(profile);
        setUserStats(stats);
      }
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please re-authenticate.");
      }
    }
  };

  const fetchUserStakes = async () => {
    try {
      const accessToken = user?.accessToken;
      if (!accessToken) return;

      const response = await axios.get(`${API_BASE}/api/contributor/stakes`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.data.success) {
        setUserStakes(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching user stakes:", error);
    }
  };

  const analyzeRepositories = async () => {
    const accessToken = user?.accessToken;

    if (!accessToken) {
      toast.error("Authentication required");
      return;
    }

    setAnalyzingRepos(true);
    try {
      const response = await axios.post(
        `${API_BASE}/api/contributor/analyze-repositories`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (response.data.success) {
        toast.success("Repository analysis completed!");
        const {
          repositories,
          contributableRepos,
          totalRepos,
          languages,
          suggestedIssues,
        } = response.data.data;
        setAnalyzedRepos(repositories);
        setRepoStats({
          total: totalRepos,
          contributable: contributableRepos,
          languages: languages,
        });

        if (suggestedIssues && suggestedIssues.length > 0) {
          setSuggestedIssues(suggestedIssues);
          toast.info(`Found ${suggestedIssues.length} suggested issues!`);
        }

        setActiveTab("repositories");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to analyze repositories",
      );
    } finally {
      setAnalyzingRepos(false);
    }
  };

  const fetchSuggestedIssues = async () => {
    const accessToken = user?.accessToken;

    if (!accessToken) {
      toast.error("Authentication required");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE}/api/contributor/suggested-issues`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (response.data.success) {
        setSuggestedIssues(response.data.data.suggestedIssues || []);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to fetch suggested issues",
      );
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case "Code Novice":
        return "bg-gray-100 text-gray-800";
      case "Code Apprentice":
        return "bg-green-100 text-green-800";
      case "Code Contributor":
        return "bg-blue-100 text-blue-800";
      case "Code Master":
        return "bg-purple-100 text-purple-800";
      case "Code Expert":
        return "bg-yellow-100 text-yellow-800";
      case "Open Source Legend":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStakeStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "expired":
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStakeStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  const progressPercentage = userStats
    ? ((userStats.xp % 1000) / 1000) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Pull Quest
              </h1>
              <Badge variant="secondary">Contributor</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/contributor/profile")}
              >
                <User className="w-4 h-4 mr-1" />
                Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/contributor/settings")}
              >
                <Settings className="w-4 h-4 mr-1" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: "overview", label: "Overview", icon: TrendingUp },
              { id: "repositories", label: "Repositories", icon: Github },
              { id: "issues", label: "Suggested Issues", icon: Target },
              { id: "stakes", label: "My Stakes", icon: Coins },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === id
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage
                      src={userProfile?.avatar_url}
                      alt={userProfile?.login}
                    />
                    <AvatarFallback>
                      {userProfile?.login?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Welcome back,{" "}
                      {userProfile?.name || userProfile?.login || "User"}!
                    </h2>
                    <p className="text-gray-600">
                      Ready to contribute to some amazing projects?
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    className={getRankColor(userStats?.rank || "Code Novice")}
                  >
                    {userStats?.rank || "Code Novice"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Coins className="w-8 h-8 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Virtual Coins
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {userStats?.coins || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-8 h-8 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        XP Points
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {userStats?.xp || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Github className="w-8 h-8 text-gray-700" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Repositories
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {userProfile?.public_repos || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Target className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Active Stakes
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {userStats?.activeBounties || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* XP Progress */}
            {userStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Progress to Next Rank</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {userStats.xp} / {userStats.nextRankXP} XP
                      </span>
                      <span className="text-sm text-gray-600">
                        {userStats.nextRankXP - userStats.xp} XP to go
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-3" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={analyzeRepositories}
                    disabled={analyzingRepos}
                    className="w-full"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {analyzingRepos
                      ? "Analyzing..."
                      : "Analyze My Repositories"}
                  </Button>
                  <Button
                    onClick={() => setActiveTab("issues")}
                    variant="outline"
                    className="w-full"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Browse Issues
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "repositories" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                My Repositories
              </h2>
              <Button onClick={analyzeRepositories} disabled={analyzingRepos}>
                <Search className="w-4 h-4 mr-2" />
                {analyzingRepos ? "Re-analyzing..." : "Refresh Analysis"}
              </Button>
            </div>

            {repoStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Github className="w-8 h-8 text-gray-700" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Total Repositories
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {repoStats.total}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Contributable
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {repoStats.contributable}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Code2 className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Languages
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {repoStats.languages.slice(0, 5).map((lang) => (
                            <Badge
                              key={lang}
                              variant="secondary"
                              className="text-xs"
                            >
                              {lang}
                            </Badge>
                          ))}
                          {repoStats.languages.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{repoStats.languages.length - 5}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {analyzedRepos.length > 0 ? (
              <div className="grid gap-4">
                {analyzedRepos.map((repo) => (
                  <Card
                    key={repo.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-2">
                            {repo.isPrivate ? (
                              <Lock className="w-4 h-4 text-gray-400" />
                            ) : (
                              <Unlock className="w-4 h-4 text-green-500" />
                            )}
                            <h3 className="text-lg font-semibold text-gray-900 hover:underline">
                              <a
                                href={repo.htmlUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {repo.fullName}
                              </a>
                            </h3>
                            {repo.isFork && (
                              <Badge variant="outline" className="text-xs">
                                <GitFork className="w-3 h-3 mr-1" /> Fork
                              </Badge>
                            )}
                            {repo.isContributable && (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                Contributable
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm max-w-2xl">
                            {repo.description || "No description provided."}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            {repo.language && (
                              <div className="flex items-center">
                                <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                                {repo.language}
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span>{repo.stargazersCount}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <GitFork className="w-4 h-4" />
                              <span>{repo.forksCount}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <AlertCircle className="w-4 h-4" />
                              <span>{repo.openIssuesCount} issues</span>
                            </div>
                            <span className="text-xs text-gray-400">
                              Updated{" "}
                              {new Date(repo.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          {repo.topics.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {repo.topics.slice(0, 7).map((topic) => (
                                <Badge
                                  key={topic}
                                  variant="outline"
                                  className="text-xs bg-gray-50"
                                >
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(repo.htmlUrl, "_blank")}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" /> View on
                            GitHub
                          </Button>
                          {repo.isContributable && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Target className="w-4 h-4 mr-2" /> Find Issues
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              !analyzingRepos && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Github className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Repositories Analyzed
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Click the button above to analyze your GitHub
                      repositories.
                    </p>
                    <Button onClick={analyzeRepositories}>
                      <Search className="w-4 h-4 mr-2" />
                      Analyze Now
                    </Button>
                  </CardContent>
                </Card>
              )
            )}

            {analyzingRepos && analyzedRepos.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
                <p className="text-gray-600">Analyzing your repositories...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "issues" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Suggested Issues
              </h2>
              <div className="flex space-x-2">
                <Button onClick={fetchSuggestedIssues} disabled={loading}>
                  <Search className="w-4 h-4 mr-2" />
                  {loading ? "Loading..." : "Refresh"}
                </Button>
                <Button
                  onClick={analyzeRepositories}
                  disabled={analyzingRepos}
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {analyzingRepos ? "Analyzing..." : "Analyze Repos"}
                </Button>
              </div>
            </div>

            {suggestedIssues.length > 0 ? (
              <div className="grid gap-6">
                {suggestedIssues.map((issue) => (
                  <Card
                    key={issue.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {issue.title}
                            </h3>
                            <Badge
                              className={getDifficultyColor(issue.difficulty)}
                            >
                              {issue.difficulty}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {issue.repository.fullName} •{" "}
                            {issue.repository.language}
                          </p>
                          <p className="text-gray-700 line-clamp-2">
                            {issue.body}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            +{issue.bounty} coins
                          </div>
                          <div className="text-sm text-gray-500">
                            +{issue.xpReward} XP
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4" />
                            <span>{issue.repository.stargazersCount}</span>
                          </div>
                          <span>Stake: {issue.stakingRequired} coins</span>
                          <span>#{issue.number}</span>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(issue.htmlUrl, "_blank")}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View Issue
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              navigate(`/contributor/issue/${issue.id}`)
                            }
                          >
                            <Coins className="w-4 h-4 mr-1" />
                            Stake Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Issues Found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Analyze your repositories first to get personalized issue
                    suggestions.
                  </p>
                  <Button
                    onClick={analyzeRepositories}
                    disabled={analyzingRepos}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {analyzingRepos ? "Analyzing..." : "Analyze Repositories"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "stakes" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">My Stakes</h2>
              <Button onClick={fetchUserStakes}>
                <Search className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            {userStakes.length > 0 ? (
              <div className="space-y-4">
                {userStakes.map((stake) => (
                  <Card key={stake._id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getStakeStatusIcon(stake.status)}
                            <Badge
                              className={getStakeStatusColor(stake.status)}
                            >
                              {stake.status.charAt(0).toUpperCase() +
                                stake.status.slice(1)}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            Issue #{stake.issueId}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            Repository: {stake.repository}
                          </p>
                          <p className="text-sm text-gray-500">
                            Staked: {stake.amount} coins • Created:{" "}
                            {new Date(stake.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          {stake.status === "accepted" && (
                            <div className="text-green-600">
                              <div className="font-semibold">
                                +{stake.coinsEarned} coins
                              </div>
                              <div className="text-sm">
                                +{stake.xpEarned} XP
                              </div>
                            </div>
                          )}
                          {stake.status === "rejected" && (
                            <div className="text-red-600">
                              <div className="font-semibold">
                                -{stake.amount} coins
                              </div>
                            </div>
                          )}
                          {stake.status === "pending" && (
                            <div className="text-yellow-600">
                              <div className="font-semibold">Pending</div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <a
                          href={stake.prUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View Pull Request
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Coins className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Stakes Yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start by staking on some issues to contribute to open source
                    projects.
                  </p>
                  <Button onClick={() => setActiveTab("issues")}>
                    <Target className="w-4 h-4 mr-2" />
                    Browse Issues
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
