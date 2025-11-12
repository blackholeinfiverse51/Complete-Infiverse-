import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import { AlertCircle, Users, BarChart, Zap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Progress } from "../components/ui/progress";

export default function ProcurementDashboard() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    try {
      const response = await api.procurement.runAnalysis();
      if (response.success) {
        setAnalysis(response.data);
      }
    } catch (error) {
      console.error('Error running procurement analysis:', error);
      setError(error.message || "Failed to run analysis");
    }
  };

  const handleRefreshAnalysis = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await fetchAnalysis();
      setSuccess("Analysis refreshed successfully!");
    } catch (error) {
      setError(error.message || "Failed to refresh analysis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Procurement Agent</h1>
          <p className="text-muted-foreground">
            Analyze employee availability and optimize task assignments
          </p>
        </div>
        <Button
          onClick={handleRefreshAnalysis}
          disabled={loading}
          className="bg-primary hover:bg-primary/90"
        >
          <Zap className="h-4 w-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>

      {success && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis?.availableEmployees?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Employees ready for new tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Workload</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Progress value={analysis?.teamWorkload || 0} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {analysis?.teamWorkload || 0}% average workload
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Task Alert */}
      {analysis?.lowTaskEmployees?.length > 0 && (
        <Alert className="bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-900">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Low Task Alert</AlertTitle>
          <AlertDescription>
            {analysis.lowTaskEmployees.length} employees have less than 1 active task and need immediate assignment:
            <div className="mt-2 space-y-1">
              {analysis.lowTaskEmployees.map((emp) => (
                <div key={emp.employeeId} className="text-sm font-medium">
                  • {emp.name} ({emp.activeTasks} active tasks)
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Available Employees Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Available Employees</CardTitle>
          <CardDescription>
            Employees who can take on new tasks based on current workload
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis?.availableEmployees?.length > 0 ? (
              analysis.availableEmployees.map((employee) => (
                <div
                  key={employee.employeeId}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/10"
                >
                  <div>
                    <p className="font-semibold">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Active tasks: {employee.activeTasks} | Completion rate: {employee.completionRate}%
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">Score: {employee.availabilityScore}</div>
                    <Progress value={employee.availabilityScore} className="w-24 h-2 mt-1" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No available employees found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Task Assignment Recommendations */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Task Assignment Recommendations</CardTitle>
          <CardDescription>
            Suggested task allocations based on employee availability and expertise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis?.recommendations?.map((rec, index) => (
              <div key={index} className="p-4 rounded-lg border bg-card">
                <p className="font-semibold">{rec.taskType}</p>
                <p className="text-sm text-muted-foreground">
                  Recommended assignee: {rec.recommendedEmployee}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {rec.reason}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}