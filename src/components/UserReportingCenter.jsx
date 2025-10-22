import { useState } from "react";
import { FileText } from "lucide-react";
import { ReportSubmissionModal } from "./ReportSubmissionModal";

export function UserReportingCenter() {
  const [showModal, setShowModal] = useState(true); // Auto-open modal

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-500" />
          Submit Weather Report
        </h1>
        <p className="text-gray-600">
          Help your community by reporting weather conditions and incidents
        </p>
      </div>

      {showModal && (
        <ReportSubmissionModal
          onClose={() => setShowModal(false)}
          onSubmitSuccess={() => {
            setShowModal(false);
            // Optional: Navigate to "My Reports" after submission
          }}
        />
      )}

      {!showModal && (
        <div className="text-center py-12">
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
          >
            Open Report Form
          </button>
        </div>
      )}
    </div>
  );
}
