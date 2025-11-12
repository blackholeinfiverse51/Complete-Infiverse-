"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Sparkles, Loader2, RefreshCw, CheckCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { api } from "../../lib/api"
import { useToast } from "../../hooks/use-toast"

export function AIInsights() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [insights, setInsights] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isApplying, setIsApplying] = useState(false)

  const fetchInsights = async () => {
    try {
      setIsLoading(true)
      const response = await api.get('/ai/optimize')
      if (response?.insights) {
        setInsights(response.insights.slice(0, 4))
      } else {
        setInsights([])
      }
    } catch (error) {
      console.error("Error fetching AI insights:", error)
      setInsights([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyAll = async () => {
    try {
      setIsApplying(true)
      const response = await api.get('/ai/optimize')
      const allInsights = response?.insights || []
      
      for (const insight of allInsights) {
        for (const action of insight.actions || []) {
          try {
            const taskTitle = insight.description?.match(/Task '([^']+)'/)?.[1]
            if (!taskTitle) continue
            
            const tasksResponse = await api.get('/tasks')
            const task = tasksResponse.find((t) => t.title === taskTitle)
            if (!task) continue

            let updates = {}
            if (action.includes("Reassign")) {
              updates.assignee = null
            } else if (action.includes("deadline")) {
              const newDueDate = new Date(task.dueDate)
              newDueDate.setDate(newDueDate.getDate() + 7)
              updates.dueDate = newDueDate.toISOString()
            } else if (action.includes("Prioritize")) {
              updates.priority = "High"
            }

            if (Object.keys(updates).length > 0) {
              await api.put(`/tasks/${task._id}`, updates)
            }
          } catch (err) {
            console.error('Error applying action:', err)
          }
        }
      }
      
      toast({
        title: "Success",
        description: "All AI recommendations applied successfully",
      })
      fetchInsights()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply recommendations",
        variant: "destructive",
      })
    } finally {
      setIsApplying(false)
    }
  }

  useEffect(() => {
    fetchInsights()
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchInsights, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <Card className="col-span-1">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Insights
            </CardTitle>
            <CardDescription>AI-powered workflow optimization</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Insights
          </CardTitle>
          <CardDescription>AI-powered workflow optimization</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No insights available. Click refresh to generate.
            </p>
          ) : (
            <ul className="space-y-2">
              {insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                    <Sparkles className="h-3 w-3 text-primary" />
                  </div>
                  <span>{insight.title || insight.description || insight}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={fetchInsights}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="default" 
              className="flex-1" 
              onClick={handleApplyAll}
              disabled={isApplying || insights.length === 0}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isApplying ? 'Applying...' : 'Apply All'}
            </Button>
          </div>
          
          <Button variant="outline" className="w-full" onClick={() => navigate("/optimization")}>
            View All Insights
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
