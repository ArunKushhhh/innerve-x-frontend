"use client"

import { NavigationTabs } from "@/components/contributor/navigation-tabs";
import { ProfileSidebar } from "@/components/contributor/profile-sidebar";
import { ProgressBar } from "@/components/contributor/progress-bar";
import { StakesList } from "@/components/contributor/stakes-list";
import { StatsCards } from "@/components/contributor/stats-cards";
import { useState, useEffect } from "react"
import axios from "axios"
import { toast } from "sonner"
import { Loader2, Star, GitFork } from "lucide-react"

import { useUser } from "@/context/UserProvider"

const GitHubContributorProfile = () => {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState("profile")
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [topLanguages, setTopLanguages] = useState<any[]>([])
  const [stakesData, setStakesData] = useState<any[]>([])
  const [repositories, setRepositories] = useState<any[]>([])

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8012"

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      const accessToken = user?.accessToken

      if (!accessToken) {
        toast.error("Please login first")
        setLoading(false)
        return
      }

      // Fetch Profile & Stats (POST to /profile, with Auth header)
      const profilePromise = axios.post(
        `${API_BASE}/api/contributor/profile`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      // Fetch Stakes (GET /stakes, with Auth header)
      const stakesPromise = axios.get(
        `${API_BASE}/api/contributor/stakes`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      const [profileRes, stakesRes] = await Promise.all([
        profilePromise,
        stakesPromise
      ])

      let githubToken = ""
      let githubUsername = ""

      // Process Profile Data
      if (profileRes.data.success) {
        const { profile, stats, githubToken: token } = profileRes.data.data
        githubToken = token
        githubUsername = profile.username || profile.login || user.githubUsername

        setUserData({
          name: profile.name || profile.login,
          username: profile.login,
          role: "Contributor",
          bio: profile.bio || "No bio available",
          location: profile.location || "Remote",
          coins: stats.coins,
          xp: stats.xp,
          avatar: profile.avatar_url,
          rank: stats.rank,
          nextRankXP: stats.nextRankXP,
          socialLinks: {
            github: profile.html_url,
            linkedin: profile.blog || "",
            twitter: profile.twitter_username ? `https://twitter.com/${profile.twitter_username}` : "",
          },
        })
      }

      // Process Stakes Data
      if (stakesRes.data.success) {
        const formattedStakes = stakesRes.data.data.map((stake: any) => ({
          id: stake._id,
          status: stake.status.charAt(0).toUpperCase() + stake.status.slice(1),
          issue: `Issue #${stake.issueId}`,
          repository: stake.repository,
          owner: stake.repository.split('/')[0] || "unknown",
          coinsStaked: stake.amount,
          coinsGained: stake.coinsEarned || 0,
          xpGained: stake.xpEarned || 0,
          dateClosed: stake.status === 'accepted' ? new Date(stake.updatedAt).toLocaleDateString() : null,
        }))
        setStakesData(formattedStakes)
      }

      // Fetch Top Languages from GitHub directly if token exists
      if (githubToken && githubUsername) {
        try {
          const languagesRes = await axios.get(`https://api.github.com/users/${githubUsername}/repos`, {
            headers: { Authorization: `Bearer ${githubToken}` }
          })

          const repos = languagesRes.data
          const languageCounts: { [key: string]: number } = {}
          let totalRepos = 0

          repos.forEach((repo: any) => {
            if (repo.language) {
              languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1
              totalRepos++
            }
          })

          const languageColors: { [key: string]: string } = {
            JavaScript: "#f1e05a",
            Python: "#3572A5",
            TypeScript: "#2b7489",
            Go: "#00ADD8",
            Rust: "#dea584",
            Java: "#b07219",
            "C++": "#f34b7d",
            HTML: "#e34c26",
            CSS: "#563d7c",
            Vue: "#41b883",
            React: "#61dafb",
          }

          const formattedLanguages = Object.entries(languageCounts)
            .map(([name, count]) => ({
              name,
              percentage: Math.round((count / totalRepos) * 100),
              color: languageColors[name] || "#ccc"
            }))
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 5)

          setTopLanguages(formattedLanguages)
          setRepositories(repos)
        } catch (langErr) {
          console.error("Failed to fetch languages", langErr)
        }
      }

    } catch (error) {
      console.error("Error fetching profile data:", error)
      toast.error("Failed to load profile data")
    } finally {
      setLoading(false)
    }
  }

  const getRank = (xp: number) => {
    if (xp >= 5000) return "Open Source Legend"
    if (xp >= 3000 && xp < 5000) return "Code Expert"
    if (xp >= 1500 && xp < 3000) return "Code Master"
    if (xp >= 500 && xp < 1500) return "Code Contributor"
    if (xp >= 100 && xp < 500) return "Code Apprentice"
    return "Code Novice"
  }

  const getNextRankXP = (xp: number) => {
    if (xp >= 5000) return 5000
    if (xp >= 3000) return 5000
    if (xp >= 1500) return 3000
    if (xp >= 500) return 1500
    if (xp >= 100) return 500
    return 100
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">Failed to load profile</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-black text-white rounded-md text-sm hover:bg-neutral-800"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const currentRank = userData.rank || getRank(userData.xp)
  const nextRankXP = userData.nextRankXP || getNextRankXP(userData.xp)
  const xpToNext = nextRankXP - userData.xp

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex gap-12">
          <ProfileSidebar userData={userData} topLanguages={topLanguages} />

          {/* Main Content */}
          <div className="flex-1">
            <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === "profile" && (
              <>
                <StatsCards coins={userData.coins} xp={userData.xp} currentRank={currentRank} xpToNext={xpToNext} />

                {xpToNext > 0 && (
                  <ProgressBar currentXP={userData.xp} nextRankXP={nextRankXP} nextRankName={getRank(nextRankXP)} />
                )}

                <StakesList stakes={stakesData} />
              </>
            )}

            {activeTab === "repositories" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-neutral-900">Repositories</h2>
                  <span className="text-sm text-neutral-500">{repositories.length} public repositories</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {repositories.sort((a, b) => b.stargazers_count - a.stargazers_count).map((repo) => (
                    <a
                      key={repo.id}
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-5 bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-neutral-900 group-hover:text-black truncate pr-4">
                          {repo.name}
                        </h3>
                        {repo.stargazers_count > 0 && (
                          <div className="flex items-center text-amber-500 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            {repo.stargazers_count}
                          </div>
                        )}
                      </div>

                      <p className="text-neutral-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                        {repo.description || "No description available"}
                      </p>

                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <div className="flex items-center gap-4">
                          {repo.language && (
                            <div className="flex items-center">
                              <span className="w-2 h-2 rounded-full bg-neutral-400 mr-2"></span>
                              {repo.language}
                            </div>
                          )}
                          {(repo.forks_count > 0) && (
                            <div className="flex items-center">
                              <GitFork className="w-3 h-3 mr-1" />
                              {repo.forks_count}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center text-neutral-400">
                          {new Date(repo.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </a>
                  ))}

                  {repositories.length === 0 && (
                    <div className="col-span-full py-12 text-center text-neutral-500">
                      No public repositories found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GitHubContributorProfile
