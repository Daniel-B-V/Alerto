import {
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  MessageSquare,
  Megaphone,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Separator } from "../../ui/separator";

const aiFilteredReports = [
  {
    id: 1,
    summary:
      "Flood waist-deep in Barangay Poblacion, bridge collapse reported nearby",
    originalLength: "247 words",
    severity: "critical",
    confidence: 95,
    location: "Barangay Poblacion, Batangas City",
    timestamp: "5 minutes ago",
    sources: 8,
    verified: false,
    originalReport:
      "Heavy rainfall has caused severe flooding in our barangay. The water level near the church area has reached waist-deep levels and continues to rise. We've also received reports that the old wooden bridge connecting our barangay to the highway has partially collapsed due to the strong current. Several families have been evacuated to the covered court. The flooding started around 2 PM and has been getting worse. Road access is completely blocked and emergency vehicles cannot pass through. We urgently need assistance from the city government for rescue operations and temporary shelter supplies.",
  },
  {
    id: 2,
    summary:
      "Power lines down on Maharlika Highway, traffic disruption expected for 4-6 hours",
    originalLength: "189 words",
    severity: "high",
    confidence: 88,
    location: "Maharlika Highway, Lipa City",
    timestamp: "12 minutes ago",
    sources: 5,
    verified: false,
    originalReport:
      "Strong winds from the ongoing storm have brought down several power lines along a 500-meter stretch of Maharlika Highway between the Shell gas station and McDonald's. MERALCO crews are on scene but estimate 4-6 hours for complete restoration. Traffic is being diverted through local roads causing significant delays. No injuries reported but there's a risk of electrocution. The area has been cordoned off by police. Local businesses are operating on generator power.",
  },
  {
    id: 3,
    summary:
      "School building roof damage in Santo Tomas Elementary, classes temporarily relocated",
    originalLength: "156 words",
    severity: "medium",
    confidence: 92,
    location: "Santo Tomas Elementary School",
    timestamp: "25 minutes ago",
    sources: 3,
    verified: true,
    originalReport:
      "The roof of Building 2 at Santo Tomas Elementary School has sustained damage from strong winds. Several galvanized iron sheets have been blown off and there's water leaking into three classrooms. The school principal has temporarily moved affected classes to the gymnasium. No students were injured as this happened during recess. Repair work is scheduled to begin once weather conditions improve.",
  },
  {
    id: 4,
    summary:
      "All clear signal for Barangay San Jose, normal operations resumed",
    originalLength: "98 words",
    severity: "low",
    confidence: 90,
    location: "Barangay San Jose, Tanauan City",
    timestamp: "45 minutes ago",
    sources: 2,
    verified: true,
    originalReport:
      "Weather conditions have significantly improved in our barangay. The rain has stopped and floodwaters have receded. All roads are now passable and children are safely attending their afternoon classes. Business establishments have reopened and public transportation is running normally. Thank you to our barangay response team for their quick action.",
  },
];

export function AdminPanel() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Administrative Reports
        </h1>
        <p className="text-gray-600">
          AI-filtered community reports for monitoring and class
          suspension decisions in Batangas Province
        </p>
      </div>

      {/* AI Summary Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            AI-Filtered Report Inbox
          </CardTitle>
          <p className="text-sm text-blue-600">
            Community reports automatically summarized and
            prioritized for monitoring decisions
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-gray-600">
                  Critical
                </span>
              </div>
              <p className="text-2xl font-bold text-red-600">
                2
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-600">
                  High
                </span>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                3
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-600">
                  Pending
                </span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                8
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-600">
                  Resolved
                </span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                15
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtered Reports */}
      <div className="space-y-4">
        {aiFilteredReports.map((report) => (
          <Card
            key={report.id}
            className="hover:shadow-md transition-shadow"
          >
            <CardContent className="p-6">
              {/* Report Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge
                      variant={
                        report.severity === "critical"
                          ? "destructive"
                          : report.severity === "high"
                            ? "default"
                            : report.severity === "medium"
                              ? "secondary"
                              : "outline"
                      }
                      className="shrink-0"
                    >
                      {report.severity}
                    </Badge>
                    {report.verified && (
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-200"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="text-blue-600 border-blue-200"
                    >
                      <Brain className="w-3 h-3 mr-1" />
                      {report.confidence}% confidence
                    </Badge>
                  </div>

                  <h3 className="font-medium text-gray-900 mb-2 leading-relaxed">
                    {report.summary}
                  </h3>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{report.location}</span>
                    <span>•</span>
                    <span>{report.timestamp}</span>
                    <span>•</span>
                    <span>{report.sources} sources</span>
                    <span>•</span>
                    <span>
                      Compressed from {report.originalLength}
                    </span>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Full Report
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Contact Reporter
                  </Button>
                </div>

                <div className="flex gap-2">
                  {report.severity === "critical" ||
                  report.severity === "high" ? (
                    <>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Megaphone className="w-4 h-4" />
                        Issue Suspension
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm">
                        Mark Reviewed
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Expandable Original Report */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                  View original community report
                </summary>
                <div className="mt-3 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 leading-relaxed">
                  {report.originalReport}
                </div>
              </details>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Brain className="w-4 h-4" />
          <span>
            AI processing 12 new reports from Batangas
            Province...
          </span>
        </div>
        <Button variant="outline">View All Reports</Button>
      </div>
    </div>
  );
}