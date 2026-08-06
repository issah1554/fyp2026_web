"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { userCan } from "@/src/services/auth/authService";
import {
  listOrders,
  updateOrderStatus,
  type Order,
} from "../../../services/trade/tradeService";

export default function OrdersPage() {
  const { user } = useAuth();
  const isLoggedIn = Boolean(user);

  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Tabs: "placed" (buyer) or "received" (seller)
  const [activeTab, setActiveTab] = useState<"placed" | "received">("placed");

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadData = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    setError("");
    try {
      const ordersData = await listOrders();
      setOrders(ordersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Separate orders
  const myUserId = user?.profile?.public_id;
  const placedOrders = useMemo(() => orders.filter((o) => o.buyer_id === myUserId), [orders, myUserId]);
  const receivedOrders = useMemo(() => orders.filter((o) => o.listing?.seller_id === myUserId), [orders, myUserId]);

  const activeOrders = useMemo(() => {
    const list = activeTab === "placed" ? placedOrders : receivedOrders;
    return list.filter((order) => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesId = order.order_id?.toLowerCase().includes(query);
        const matchesTitle = order.listing?.title?.toLowerCase().includes(query);
        const matchesCommodity = order.listing?.commodity?.name?.toLowerCase().includes(query);
        if (!matchesId && !matchesTitle && !matchesCommodity) return false;
      }
      // Status
      if (statusFilter && order.status !== statusFilter) return false;

      return true;
    });
  }, [activeTab, placedOrders, receivedOrders, searchQuery, statusFilter]);

  // Handle status update
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    if (!window.confirm(`Are you sure you want to change order status to ${newStatus}?`)) return;
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const response = await updateOrderStatus(orderId, newStatus);
      setNotice(response.message);
      setSelectedOrder(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order status.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-4">
      {/* Header */}
      <section className="rounded-xl border border-main-200 bg-main-100 p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-main-950 sm:text-3xl">Trade Orders</h1>
        <p className="mt-2 text-sm text-main-600">
          Track purchases and incoming sales orders, accept trades, and update shipment status.
        </p>
      </section>

      {/* Tabs */}
      <div className="flex border-b border-main-200">
        <button
          onClick={() => {
            setActiveTab("placed");
            setStatusFilter("");
          }}
          className={`pb-3 text-sm font-bold border-b-2 px-4 transition-all cursor-pointer ${
            activeTab === "placed"
              ? "border-primary-600 text-primary-700"
              : "border-transparent text-main-500 hover:text-main-800"
          }`}
        >
          <i className="bi bi-cart-check mr-2" />
          Purchases (Orders Placed)
          <span className="ml-2 rounded-full bg-main-200 px-2 py-0.5 text-xs text-main-700">
            {placedOrders.length}
          </span>
        </button>
        <button
          onClick={() => {
            setActiveTab("received");
            setStatusFilter("");
          }}
          className={`pb-3 text-sm font-bold border-b-2 px-4 transition-all cursor-pointer ${
            activeTab === "received"
              ? "border-primary-600 text-primary-700"
              : "border-transparent text-main-500 hover:text-main-800"
          }`}
        >
          <i className="bi bi-mailbox mr-2" />
          Sales (Orders Received)
          <span className="ml-2 rounded-full bg-main-200 px-2 py-0.5 text-xs text-main-700">
            {receivedOrders.length}
          </span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="rounded-xl border border-danger-300 bg-danger-100 px-4 py-3 text-sm font-semibold text-danger-700">
          <i className="bi bi-exclamation-triangle-fill mr-2" />
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-success-300 bg-success-100 px-4 py-3 text-sm font-semibold text-success-700">
          <i className="bi bi-check-circle-fill mr-2" />
          {notice}
        </div>
      )}

      {/* Search & Filter Controls */}
      <section className="flex flex-col gap-4 rounded-xl border border-main-200 bg-main-100 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-main-400" />
          <input
            type="text"
            placeholder="Search by Order ID, Listing Title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-main-300 bg-main-0 py-2 pl-10 pr-4 text-sm outline-none focus:border-primary-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-main-300 bg-main-0 px-3 py-2 text-sm outline-none focus:border-primary-500 transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </section>

      {/* Orders List Table */}
      {loading ? (
        <div className="py-24 text-center text-main-500">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent align-[-0.125em]" />
          <p className="mt-4 font-semibold">Loading orders...</p>
        </div>
      ) : activeOrders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-main-300 py-16 text-center text-main-500 bg-main-100">
          <i className="bi bi-receipt text-4xl text-main-300" />
          <p className="mt-4 text-base font-bold text-main-800">No orders found</p>
          <p className="text-xs text-main-500">You don't have any orders listed in this tab.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-main-200 bg-main-100 shadow-sm">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead>
              <tr className="border-b border-main-200 text-xs font-bold uppercase text-main-500 bg-main-200/50">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Commodity / Title</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Total Price</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Placed Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-main-200 bg-main-0">
              {activeOrders.map((order) => (
                <tr key={order.order_id} className="hover:bg-main-50 transition-colors">
                  <td className="py-4 px-4 font-mono text-xs font-bold text-main-700">#{order.order_id}</td>
                  <td className="py-4 px-4">
                    <p className="font-bold text-main-900">{order.listing?.title}</p>
                    <span className="inline-block mt-0.5 rounded bg-primary-100 px-2 py-0.5 text-2xs font-semibold text-primary-700">
                      {order.listing?.commodity?.name}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-main-700">
                    {parseFloat(order.quantity).toLocaleString()} {order.listing?.commodity?.unit}
                  </td>
                  <td className="py-4 px-4 font-bold text-main-900">
                    TZS {parseFloat(order.total_price).toLocaleString()}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-2xs font-bold uppercase ${
                        order.status === "pending"
                          ? "bg-warning-100 text-warning-700"
                          : order.status === "accepted"
                          ? "bg-primary-100 text-primary-700"
                          : order.status === "completed"
                          ? "bg-success-100 text-success-700"
                          : "bg-danger-100 text-danger-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-main-500 text-xs">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="rounded border border-main-300 bg-main-100 px-2.5 py-1.5 text-xs font-bold text-main-700 hover:border-primary-300 hover:text-primary-700 transition-colors cursor-pointer"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-main-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-main-200 bg-main-100 p-6 shadow-xl animate-zoom-in">
            <h2 className="text-xl font-bold text-main-950">Order Details</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between border-b border-main-200 pb-2">
                <span className="text-main-500">Order ID:</span>
                <span className="font-mono font-bold text-main-900">#{selectedOrder.order_id}</span>
              </div>
              <div className="flex justify-between border-b border-main-200 pb-2">
                <span className="text-main-500">Listing:</span>
                <span className="font-bold text-main-900">{selectedOrder.listing?.title}</span>
              </div>
              <div className="flex justify-between border-b border-main-200 pb-2">
                <span className="text-main-500">Commodity:</span>
                <span className="font-bold text-primary-700">{selectedOrder.listing?.commodity?.name}</span>
              </div>
              <div className="flex justify-between border-b border-main-200 pb-2">
                <span className="text-main-500">Unit Price:</span>
                <span className="font-semibold text-main-900">
                  TZS {parseFloat(selectedOrder.listing?.price || "0").toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-b border-main-200 pb-2">
                <span className="text-main-500">Quantity Ordered:</span>
                <span className="font-semibold text-main-900">
                  {parseFloat(selectedOrder.quantity).toLocaleString()} {selectedOrder.listing?.commodity?.unit}
                </span>
              </div>
              <div className="flex justify-between border-b border-main-200 pb-2">
                <span className="text-main-500 font-bold">Total Price:</span>
                <span className="font-extrabold text-primary-700 text-base">
                  TZS {parseFloat(selectedOrder.total_price).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-b border-main-200 pb-2">
                <span className="text-main-500">Status:</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-2xs font-bold uppercase ${
                    selectedOrder.status === "pending"
                      ? "bg-warning-100 text-warning-700"
                      : selectedOrder.status === "accepted"
                      ? "bg-primary-100 text-primary-700"
                      : selectedOrder.status === "completed"
                      ? "bg-success-100 text-success-700"
                      : "bg-danger-100 text-danger-700"
                  }`}
                >
                  {selectedOrder.status}
                </span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-main-500">Ordered On:</span>
                <span className="text-main-700">{new Date(selectedOrder.created_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Action buttons based on Role and Status */}
            <div className="mt-6 flex justify-end gap-2 border-t border-main-200 pt-4">
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg border border-main-300 bg-main-0 px-4 py-2 text-sm font-bold text-main-700 hover:bg-main-50 cursor-pointer"
              >
                Close
              </button>

              {activeTab === "placed" && selectedOrder.status === "pending" && (
                <button
                  disabled={submitting}
                  onClick={() => void handleStatusUpdate(selectedOrder.order_id, "cancelled")}
                  className="rounded-lg bg-danger-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-danger-700 transition-all cursor-pointer"
                >
                  Cancel Order
                </button>
              )}

              {activeTab === "received" && selectedOrder.status === "pending" && (
                <>
                  <button
                    disabled={submitting}
                    onClick={() => void handleStatusUpdate(selectedOrder.order_id, "cancelled")}
                    className="rounded-lg bg-danger-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-danger-700 transition-all cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    disabled={submitting}
                    onClick={() => void handleStatusUpdate(selectedOrder.order_id, "accepted")}
                    className="rounded-lg bg-success-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-success-700 transition-all cursor-pointer"
                  >
                    Accept
                  </button>
                </>
              )}

              {activeTab === "received" && selectedOrder.status === "accepted" && (
                <button
                  disabled={submitting}
                  onClick={() => void handleStatusUpdate(selectedOrder.order_id, "completed")}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-main-0 hover:bg-primary-700 transition-all cursor-pointer"
                >
                  Mark Completed
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
