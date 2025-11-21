import { useState } from 'react';
import { Button } from '../ui/button';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { collection, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

export function FixTimestampsButton() {
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState(null);

  const fixInvalidTimestamps = async () => {
    setFixing(true);
    setResult(null);

    try {
      const reportsRef = collection(db, 'reports');
      const snapshot = await getDocs(reportsRef);

      const invalidReports = [];

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const report = { id: docSnap.id, ...data };

        // Check if createdAt is invalid
        let hasInvalidTimestamp = false;

        if (!report.createdAt) {
          hasInvalidTimestamp = true;
        } else if (report.createdAt._methodName === 'serverTimestamp') {
          // Unresolved serverTimestamp sentinel
          hasInvalidTimestamp = true;
        } else if (report.createdAt.seconds === undefined && report.createdAt.toDate === undefined) {
          // Not a Firestore Timestamp
          hasInvalidTimestamp = true;
        } else {
          // Try to convert to date
          try {
            const date = report.createdAt.toDate ? report.createdAt.toDate() : new Date(report.createdAt);
            if (isNaN(date.getTime())) {
              hasInvalidTimestamp = true;
            }
          } catch (error) {
            hasInvalidTimestamp = true;
          }
        }

        if (hasInvalidTimestamp) {
          invalidReports.push({
            id: report.id,
            title: report.title || 'Untitled',
            userName: report.userName || 'Unknown'
          });
        }
      });

      if (invalidReports.length === 0) {
        setResult({
          success: true,
          message: `All ${snapshot.docs.length} reports have valid timestamps!`,
          fixed: 0,
          total: 0
        });
        setFixing(false);
        return;
      }

      // Fix invalid timestamps
      let fixedCount = 0;
      const errors = [];

      for (const report of invalidReports) {
        try {
          const reportRef = doc(db, 'reports', report.id);
          await updateDoc(reportRef, {
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            _timestampFixed: true
          });
          fixedCount++;
        } catch (error) {
          errors.push(`${report.title}: ${error.message}`);
        }
      }

      setResult({
        success: fixedCount === invalidReports.length,
        message: `Fixed ${fixedCount} out of ${invalidReports.length} reports`,
        fixed: fixedCount,
        total: invalidReports.length,
        errors
      });

    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error.message}`,
        fixed: 0,
        total: 0
      });
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={fixInvalidTimestamps}
        disabled={fixing}
        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white"
      >
        {fixing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Fixing Timestamps...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            Fix Invalid Timestamps
          </>
        )}
      </Button>

      {result && (
        <div className={`p-4 rounded-lg border ${
          result.success
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-2">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`font-semibold ${
                result.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {result.message}
              </p>
              {result.errors && result.errors.length > 0 && (
                <div className="mt-2 text-sm text-red-800">
                  <p className="font-medium">Errors:</p>
                  <ul className="list-disc list-inside">
                    {result.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-600">
        This will find all reports with invalid timestamps and set them to the current time.
        The operation is safe and can be run multiple times.
      </p>
    </div>
  );
}
