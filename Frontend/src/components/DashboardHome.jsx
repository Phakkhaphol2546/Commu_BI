import React, { useState, useEffect, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Loader2,
  PieChart as PieIcon,
  Calendar,
  DollarSign,
  Wallet,
  ShoppingBag,
  Zap,
  ArrowRight,
  ArrowUpRight,
  Filter,
} from "lucide-react";

// --- Helper: Linear Regression ---
const calculateLinearRegression = (values) => {
  const n = values.length;
  if (n < 2) return null;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }
  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return null;
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
};

// --- Component: KPI Card ---
function KPICard({
  title,
  value,
  unit,
  icon,
  color,
  trendLabel,
  trendValue,
  onClick,
}) {
  const bgClass = color
    .replace("text-", "bg-")
    .replace("600", "50")
    .replace("500", "50");

  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden rounded-3xl sm:rounded-[2rem] bg-white p-5 sm:p-6 shadow-sm border border-slate-100 
                 transition-all duration-300 ease-out
                 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-100
                 active:scale-95 active:shadow-inner cursor-pointer group"
    >
      <div
        className={`absolute -right-6 -top-6 h-24 w-24 sm:h-32 sm:w-32 rounded-full opacity-20 blur-2xl sm:blur-3xl transition-opacity group-hover:opacity-40 ${color.replace("text-", "bg-")}`}
      ></div>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <div
            className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl ${bgClass} ${color} shadow-sm group-hover:scale-110 transition-transform duration-300`}
          >
            {icon}
          </div>
          {(trendLabel || trendValue) && (
            <div className="flex flex-col items-end">
              <span
                className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full ${bgClass} ${color} flex items-center gap-1`}
              >
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-slate-500 text-xs sm:text-sm font-medium">{title}</p>
          <div className="flex items-baseline gap-1 sm:gap-2">
            <h3
              className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-800`}
            >
              {value}
            </h3>
            {unit && (
              <span className="text-[10px] sm:text-xs text-slate-400 font-medium">{unit}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [dateRange, setDateRange] = useState("this_month");

const API_BASE_URL = window.location.hostname === "localhost" 
  ? "http://localhost:3001" 
  : "https://communitybi.sru.ac.th";
  const currentDate = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    const fetchData = async () => {
      let orgId = "";
      try {
        const userStr = localStorage.getItem("otop_user");
        if (userStr) {
          const user = JSON.parse(userStr);
          orgId = user.organization_id;
          setOrgName(user.org_name || "");
        }
      } catch (e) {
        console.error(e);
      }

      if (!orgId) {
        setLoading(false);
        return;
      }

      try {
        const [transRes, prodRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/transactions?org_id=${orgId}`),
          fetch(`${API_BASE_URL}/api/products?org_id=${orgId}`),
        ]);

        const transData = transRes.ok ? await transRes.json() : [];
        const processedTrans = Array.isArray(transData)
          ? transData.map((item) => ({
              ...item,
              dateObj: new Date(item.transaction_date),
              year: new Date(item.transaction_date).getFullYear(),
              month: new Date(item.transaction_date).getMonth(),
              sales: Number(item.price) * Number(item.quantity),
              cost: Number(item.cost) * Number(item.quantity),
              profit:
                (Number(item.price) - Number(item.cost)) *
                Number(item.quantity),
            }))
          : [];

        setTransactions(processedTrans);
        setProducts(prodRes.ok ? await prodRes.json() : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter((t) => {
      if (dateRange === "all") return true;
      if (dateRange === "today")
        return t.dateObj.toDateString() === now.toDateString();
      if (dateRange === "7days") {
        const date7 = new Date(now);
        date7.setDate(now.getDate() - 7);
        return t.dateObj >= date7;
      }
      if (dateRange === "this_month")
        return (
          t.dateObj.getMonth() === now.getMonth() &&
          t.dateObj.getFullYear() === now.getFullYear()
        );
      return true;
    });
  }, [transactions, dateRange]);

  const dashboardData = useMemo(() => {
    const totalSales = filteredTransactions.reduce((sum, t) => sum + t.sales, 0);
    const totalProfit = filteredTransactions.reduce((sum, t) => sum + t.profit, 0);
    const totalOrders = new Set(filteredTransactions.map((t) => t.id)).size;

    return { totalSales, totalProfit, totalOrders };
  }, [filteredTransactions, transactions]);

  // --- Charts Configuration ---
  const revenueAreaChart = useMemo(() => {
    if (!filteredTransactions.length) return null;
    const grouped = filteredTransactions.reduce((acc, t) => {
      const date = t.dateObj.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
      });
      acc[date] = (acc[date] || 0) + t.sales;
      return acc;
    }, {});
    const keys = Object.keys(grouped);
    const values = Object.values(grouped);

    return {
      tooltip: {
        trigger: "axis",
        formatter: "{b}<br/>ยอดขาย: <b>{c} บาท</b>",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 8,
        textStyle: { fontSize: 12 },
      },
      grid: {
        left: "2%",
        right: "4%",
        bottom: "0%",
        top: "12%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: keys,
        boundaryGap: false,
        axisLine: { show: true, lineStyle: { color: "#e2e8f0" } },
        axisTick: { show: false },
        axisLabel: { color: "#64748b", fontSize: 10, margin: 12 },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { type: "dashed", color: "#f1f5f9" } },
        axisLabel: { color: "#94a3b8", fontSize: 10 },
      },
      series: [
        {
          data: values,
          type: "line",
          smooth: true,
          showSymbol: false,
          symbolSize: 8,
          lineStyle: { width: 3, color: "#8b5cf6" },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(139, 92, 246, 0.4)" },
              { offset: 1, color: "rgba(139, 92, 246, 0.0)" },
            ]),
          },
        },
      ],
    };
  }, [filteredTransactions]);

  const categoryDonutChart = useMemo(() => {
    if (!filteredTransactions.length) return null;
    const grouped = filteredTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.sales;
      return acc;
    }, {});
    const data = Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
    }));

    return {
      tooltip: { trigger: "item", formatter: "{b}: {c} บาท ({d}%)", textStyle: { fontSize: 12 } },
      legend: {
        bottom: "0%",
        left: "center",
        icon: "circle",
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { fontSize: 11, color: "#64748b" },
      },
      color: ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"],
      series: [
        {
          type: "pie",
          radius: ["40%", "65%"],
          center: ["50%", "45%"],
          itemStyle: { borderRadius: 8, borderColor: "#fff", borderWidth: 2 },
          data: data,
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              fontSize: "14",
              fontWeight: "bold",
              color: "#334155",
            },
          },
        },
      ],
    };
  }, [filteredTransactions]);

  const topProductsChart = useMemo(() => {
    if (!filteredTransactions.length) return null;
    const grouped = filteredTransactions.reduce((acc, t) => {
      acc[t.product] = (acc[t.product] || 0) + t.sales;
      return acc;
    }, {});
    const sorted = Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      tooltip: { trigger: "axis", formatter: "{b}<br/>ยอดขาย: {c} บาท", textStyle: { fontSize: 12 } },
      grid: {
        left: "0%",
        right: "8%",
        bottom: "0%",
        top: "0%",
        containLabel: true,
      },
      xAxis: { type: "value", show: false },
      yAxis: {
        type: "category",
        data: sorted.map((i) => i[0]),
        inverse: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "#64748b",
          width: 80,
          overflow: "truncate",
          fontSize: 11,
        },
      },
      series: [
        {
          type: "bar",
          data: sorted.map((i) => i[1]),
          barWidth: 14,
          itemStyle: {
            borderRadius: [0, 6, 6, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: "#3b82f6" },
              { offset: 1, color: "#2563eb" },
            ]),
          },
          label: {
            show: true,
            position: "right",
            formatter: "฿{c}",
            fontSize: 10,
            color: "#64748b",
          },
        },
      ],
    };
  }, [filteredTransactions]);

  const criticalStock = useMemo(
    () =>
      products
        .filter((p) => (Number(p.stock) || 0) <= 20)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5),
    [products],
  );

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );

  return (
    <div className="p-4 sm:p-6 md:p-10 lg:p-12 bg-slate-50/50 min-h-screen font-sans pb-24 space-y-6 sm:space-y-8 lg:space-y-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 sm:gap-6 animate-in slide-in-from-top-5 duration-500">
        <div className="w-full lg:w-auto">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] sm:text-xs font-bold animate-pulse">
              Live Dashboard
            </span>
            <span className="text-slate-400 text-[10px] sm:text-xs flex items-center gap-1">
              <Calendar size={12} /> {currentDate}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight">
            ภาพรวมธุรกิจ{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              กลุ่ม{orgName}
            </span>
          </h1>
        </div>

        {/* Date Filter Pills - Scrollable on mobile */}
        <div className="w-full lg:w-auto overflow-x-auto pb-2 -mb-2 custom-scrollbar">
          <div className="flex bg-white p-1 sm:p-1.5 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 min-w-max">
            {[
              { id: "today", label: "วันนี้" },
              { id: "7days", label: "7 วัน" },
              { id: "this_month", label: "เดือนนี้" },
              { id: "all", label: "ทั้งหมด" },
            ].map((Range) => (
              <button
                key={Range.id}
                onClick={() => setDateRange(Range.id)}
                className={`px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all duration-200 whitespace-nowrap active:scale-95 ${dateRange === Range.id ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
              >
                {Range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
        <KPICard
          title="ยอดขายรวม"
          value={dashboardData.totalSales.toLocaleString()}
          unit="บาท"
          icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
          color="text-indigo-600"
          trendValue="รายได้"
        />
        <KPICard
          title="กำไรสุทธิ"
          value={dashboardData.totalProfit.toLocaleString()}
          unit="บาท"
          icon={<Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
          color="text-emerald-600"
          trendValue="Net"
        />
        <KPICard
          title="สถานะระบบ"
          value="ปกติ"
          icon={<Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
          color="text-blue-500"
          trendValue="System"
        />
      </div>

      {/* Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-2.5 bg-indigo-50 rounded-xl sm:rounded-2xl text-indigo-600">
                <ArrowUpRight className="w-5 h-5 sm:w-auto sm:h-auto" />
              </div>
              แนวโน้มรายได้
            </h3>
            <button className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 sm:p-2 hover:bg-slate-50 rounded-xl">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          <div className="h-[220px] sm:h-[300px] lg:h-[350px] w-full">
            {revenueAreaChart ? (
              <ReactECharts
                option={revenueAreaChart}
                style={{ height: "100%", width: "100%" }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-300">
                ยังไม่มีข้อมูลการขาย
              </div>
            )}
          </div>
        </div>

        {/* Category Mix */}
        <div className="bg-white p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-pink-50 rounded-xl sm:rounded-2xl text-pink-500">
              <PieIcon className="w-5 h-5 sm:w-auto sm:h-auto" />
            </div>
            สัดส่วนยอดขาย
          </h3>
          <div className="h-[220px] sm:h-[300px] lg:h-[350px] w-full">
            {categoryDonutChart ? (
              <ReactECharts
                option={categoryDonutChart}
                style={{ height: "100%", width: "100%" }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-300">
                ไม่มีข้อมูลสินค้า
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Top Products */}
        <div className="bg-white p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-blue-50 rounded-xl sm:rounded-2xl text-blue-500">
              <BarChart3 className="w-5 h-5 sm:w-auto sm:h-auto" />
            </div>
            5 สินค้าทำเงินสูงสุด
          </h3>
          <div className="h-[250px] sm:h-[300px] w-full">
            {topProductsChart ? (
              <ReactECharts
                option={topProductsChart}
                style={{ height: "100%", width: "100%" }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-300">
                ไม่มีข้อมูลสินค้า
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-2.5 bg-amber-50 rounded-xl sm:rounded-2xl text-amber-500">
                <AlertTriangle className="w-5 h-5 sm:w-auto sm:h-auto" />
              </div>
              สินค้าใกล้หมด
            </h3>
            <span className="bg-amber-100 text-amber-700 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-sm">
              {criticalStock.length} รายการ
            </span>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar pr-1 sm:pr-2 max-h-[250px] sm:max-h-full">
            <table className="w-full text-left border-collapse">
              <tbody className="space-y-2 sm:space-y-3 block">
                {criticalStock.map((p) => (
                  <tr
                    key={p.id}
                    className="group hover:bg-slate-50 transition-colors rounded-xl sm:rounded-2xl flex items-center p-2.5 sm:p-3 cursor-pointer active:scale-95 duration-200 border border-transparent hover:border-slate-100"
                  >
                    <td className="flex items-center gap-3 sm:gap-4 w-full">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 group-hover:border-indigo-200 transition-colors">
                        <img
                          src={p.image_url || "https://via.placeholder.com/50"}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/50";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors text-sm sm:text-base">
                          {p.name}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-400 truncate">{p.category}</p>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <p className="font-black text-slate-800 text-lg sm:text-xl leading-none">
                          {p.stock}
                        </p>
                        <span
                          className={`text-[10px] sm:text-xs font-bold ${p.stock === 0 ? "text-red-500" : "text-amber-500"}`}
                        >
                          {p.stock === 0 ? "หมดแล้ว" : "เติมด่วน"}
                        </span>
                      </div>
                      <ArrowRight
                        className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0"
                      />
                    </td>
                  </tr>
                ))}
                {criticalStock.length === 0 && (
                  <tr>
                    <td className="py-10 sm:py-16 w-full text-center text-slate-400 flex flex-col items-center gap-3 sm:gap-4">
                      <div className="p-4 sm:p-5 bg-emerald-50 rounded-full text-emerald-400 mb-1 sm:mb-2">
                        <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
                      </div>
                      <p className="text-base sm:text-lg font-medium">
                        สต็อกสินค้าเพียงพอทุกรายการ
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}