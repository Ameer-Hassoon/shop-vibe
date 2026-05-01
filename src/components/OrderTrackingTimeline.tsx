"use client";

interface OrderTrackingTimelineProps {
  status: string;
  estimatedDelivery?: string | null;
}

const statusSteps = [
  {
    key: "PENDING",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    key: "PROCESSING",
    icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  },
  {
    key: "SHIPPED",
    icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
  },
  { key: "DELIVERED", icon: "M5 13l4 4L19 7" },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Order Placed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED_ORDER: "Order Cancelled",
  REFUNDED_ORDER: "Order Refunded",
  cancelledText: "This order has been cancelled.",
  refundedText: "This order has been refunded.",
  inProgress: "In progress",
  orderStatus: "Order Status",
  estimatedDelivery: "Estimated Delivery",
};

export function OrderTrackingTimeline({
  status,
  estimatedDelivery,
}: OrderTrackingTimelineProps) {
  let currentIndex = statusSteps.findIndex((s) => s.key === status);
  const isCancelled = status === "CANCELLED" || status === "REFUNDED";
  const isTerminalStatus = (s: string) =>
    s === "DELIVERED" || s === "CANCELLED" || s === "REFUNDED";

  if (currentIndex === -1) {
    currentIndex = 0;
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const getStepLabel = (key: string) => {
    return STATUS_LABELS[key] || key;
  };

  const getStatusTitle = () => {
    if (status === "CANCELLED") return STATUS_LABELS["CANCELLED_ORDER"];
    if (status === "REFUNDED") return STATUS_LABELS["REFUNDED_ORDER"];
    return STATUS_LABELS["orderStatus"];
  };

  const getCancelledText = () => {
    if (status === "CANCELLED") return STATUS_LABELS["cancelledText"];
    return STATUS_LABELS["refundedText"];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {!isCancelled && <h3 className="font-semibold text-gray-900 dark:text-white mb-6">{getStatusTitle()}</h3>}

      {isCancelled ? (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
          <svg
            className="w-6 h-6 text-red-500 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <div>
            <p className="font-medium text-red-700 dark:text-red-300">
              {getStatusTitle()}
            </p>
            <p className="text-sm text-red-600 dark:text-red-400">
              {getCancelledText()}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-600" />
            <div className="space-y-8">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentIndex;
                const isCurrent = index === currentIndex;

                return (
                  <div
                    key={step.key}
                    className="relative flex items-start gap-4"
                  >
                    <div
                      className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-600"
                      }`}
                    >
                      <svg
                        className={`w-5 h-5 ${isCompleted ? "text-white" : "text-gray-400 dark:text-gray-300"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={step.icon}
                        />
                      </svg>
                    </div>
                    <div className="flex-1 pt-1">
                      <p
                        className={`font-medium ${isCurrent ? "text-indigo-600 dark:text-indigo-400" : isCompleted ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}
                      >
                        {getStepLabel(step.key)}
                      </p>
                      {isCurrent && !isTerminalStatus(status) && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {STATUS_LABELS["inProgress"]}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {estimatedDelivery && status !== "DELIVERED" && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">{STATUS_LABELS["estimatedDelivery"]}</p>
              <p className="font-medium text-green-700 dark:text-green-400">
                {formatDate(estimatedDelivery)}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
