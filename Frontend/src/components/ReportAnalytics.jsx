import React, { useState, useMemo, useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import {
  LayoutDashboard,
  Settings2,
  Table,
  Plus,
  X,
  FileSpreadsheet,
  TrendingUp,
  Activity,
  CheckSquare,
  Square,
  DollarSign,
  Wallet,
  Loader2,
  Calculator,
  Calendar,
  Zap,
  Target,
  Edit3,
  Save,
  Coins,
  Layers,
  Flag,
  ArrowUpRight,
  BarChart3,
  PieChart as PieIcon,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Goal,
  Clock,
  ChevronDown,
  Search,
} from "lucide-react";

// --- Options (Thai) ---
const dimensionOptions = [
  { id: "category", label: "หมวดหมู่สินค้า" },
  { id: "product", label: "ชื่อสินค้า" },
  { id: "month", label: "เดือน" },
  { id: "year", label: "ปี" },
];

const metricOptions = [
  { id: "sales", label: "ยอดขายรวม (บาท)" },
  { id: "cost", label: "ต้นทุนรวม (บาท)" },
  { id: "profit", label: "กำไรสุทธิ (บาท)" },
  { id: "quantity", label: "จำนวนที่ขาย (ชิ้น)" },
];

// รายชื่อเดือนภาษาไทย
const monthNamesThai = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export default function ReportAnalytics() {
  const chartRef = useRef(null);
  const menuRef = useRef(null);

const API_BASE_URL = window.location.hostname === "localhost" 
  ? "http://localhost:3001" 
  : "https://communitybi.sru.ac.th";

  // --- Global State ---
  const [viewMode, setViewMode] = useState("basic");
  const [rawTransactions, setRawTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [orgName, setOrgName] = useState("");

  // --- Advanced State ---
  const [advDimension, setAdvDimension] = useState("category");
  const [advMeasure, setAdvMeasure] = useState("sales");
  const [advLegend, setAdvLegend] = useState("none");
  const [advChartType, setAdvChartType] = useState("bar");
  const [activeFilters, setActiveFilters] = useState({});
  const [visibleSlicers, setVisibleSlicers] = useState(["category"]);
  const [showAddSlicerMenu, setShowAddSlicerMenu] = useState(false);

  // --- KPI & Targets State ---
  const [targetPeriod, setTargetPeriod] = useState("this_month");
  const [targets, setTargets] = useState({
    this_month: { sales: 50000, profit: 20000, cost: 20000 },
    this_quarter: { sales: 150000, profit: 60000, cost: 60000 }, // ✅ เพิ่มเป้าหมายระดับไตรมาส
    this_year: { sales: 600000, profit: 240000, cost: 240000 },
    all_time: { sales: 1000000, profit: 400000, cost: 400000 },
  });
  const [isEditingTargets, setIsEditingTargets] = useState(false);

  // --- Basic State ---
  const [basicFilterRange, setBasicFilterRange] = useState("this_month");
  const [basicDateRange, setBasicDateRange] = useState({ start: "", end: "" });
  const [basicDimension, setBasicDimension] = useState("category");

  // --- Forecast & Linear Regression State ---
  const [inputSales, setInputSales] = useState(10000);
  const [predictedProfit, setPredictedProfit] = useState(0);
  const [regressionModel, setRegressionModel] = useState({
    a: 0,
    b: 0,
    r2: 0,
    mae: 0,
    ready: false,
    isEstimate: false,
  });
  const [selectedProductForForecast, setSelectedProductForForecast] =
    useState("all");
  
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [modal, setModal] = useState({ isOpen: false, type: '', title: '', text: '', value: '', targetId: null });

  useEffect(() => {
    const savedTargets = localStorage.getItem("kpi_targets_v2");
    if (savedTargets) {
      try {
        setTargets(JSON.parse(savedTargets));
      } catch (e) {}
    }
    
    const savedHistory = localStorage.getItem("prediction_history");
    if (savedHistory) {
        try {
            setPredictionHistory(JSON.parse(savedHistory));
        } catch(e) {}
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        let orgId = "";
        try {
          const userStr = localStorage.getItem("otop_user");
          if (userStr) {
            const user = JSON.parse(userStr);
            orgId = user.organization_id;
            setOrgName(user.org_name || "");
          }
        } catch (e) {
          console.error("Error parsing user:", e);
        }

        if (!orgId) {
          setLoading(false);
          return;
        }

        const [transRes, prodRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/transactions?org_id=${orgId}`),
          fetch(`${API_BASE_URL}/api/products?org_id=${orgId}`),
        ]);

        const transData = transRes.ok ? await transRes.json() : [];
        const prodData = prodRes.ok ? await prodRes.json() : [];

        if (Array.isArray(transData)) {
          const processed = transData.map((item) => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.price) || 0;
            const cost = Number(item.cost) || 0;
            let dateObj = new Date(item.transaction_date || item.created_at);
            if (isNaN(dateObj.getTime())) dateObj = new Date();

            return {
              id: item.id,
              dateObj: dateObj,
              date: dateObj.toISOString().split("T")[0],
              year: dateObj.getFullYear(),
              month: dateObj.getMonth(),
              day: dateObj.getDate(),
              category: item.category || "อื่นๆ",
              product: item.product || "ไม่ระบุ",
              variant: item.variant_name || "ไม่ระบุ",
              branch: item.branch || "สำนักงานใหญ่",
              customerType: item.customer_type || "ทั่วไป",
              sales: price * qty,
              cost: cost * qty,
              profit: (price - cost) * qty,
              quantity: qty,
            };
          });
          setRawTransactions(processed);
        }
        setProducts(prodData);
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (rawTransactions.length > 0) {
      let data = rawTransactions;
      if (selectedProductForForecast !== "all") {
        data = data.filter((t) => t.product === selectedProductForForecast);
      }

      const points = data.map((t) => ({ x: t.sales, y: t.profit }));

      if (points.length >= 2) {
        const n = points.length;
        const sumX = points.reduce((acc, p) => acc + p.x, 0);
        const sumY = points.reduce((acc, p) => acc + p.y, 0);
        const sumXY = points.reduce((acc, p) => acc + p.x * p.y, 0);
        const sumXX = points.reduce((acc, p) => acc + p.x * p.x, 0);

        const denominator = n * sumXX - sumX * sumX;
        if (denominator !== 0) {
          const a = (n * sumXY - sumX * sumY) / denominator;
          const b = (sumY - a * sumX) / n;

          let sumError = 0;
          points.forEach((p) => {
            const predictedY = a * p.x + b;
            sumError += Math.abs(p.y - predictedY);
          });
          const mae = sumError / n;

          setRegressionModel({ a, b, ready: true, count: n, mae, isEstimate: false });
        } else {
          setRegressionModel({ a: 0, b: 0, ready: false, mae: 0, isEstimate: false });
        }
      } else {
        const avgMargin =
          data.length > 0
            ? data.reduce((sum, t) => sum + t.profit / t.sales, 0) / data.length
            : 0.3;
        
        let sumError = 0;
        points.forEach((p) => {
          const predictedY = avgMargin * p.x;
          sumError += Math.abs(p.y - predictedY);
        });
        const mae = points.length > 0 ? sumError / points.length : 0;

        setRegressionModel({
          a: avgMargin,
          b: 0,
          ready: true,
          mae: mae,
          isEstimate: true,
        });
      }
    }
  }, [rawTransactions, selectedProductForForecast]);

  useEffect(() => {
    if (regressionModel.ready) {
      const x = Number(inputSales) || 0;
      const y = regressionModel.a * x + regressionModel.b;
      setPredictedProfit(y);
    }
  }, [inputSales, regressionModel]);

  const handleSaveTargets = () => {
    localStorage.setItem("kpi_targets_v2", JSON.stringify(targets));
    setIsEditingTargets(false);
  };

  const handleTargetChange = (type, value) => {
    setTargets((prev) => ({
      ...prev,
      [targetPeriod]: { ...prev[targetPeriod], [type]: Number(value) },
    }));
  };
  
  const handleSavePrediction = () => {
      const newRecord = {
          id: Date.now(),
          timestamp: new Date().toLocaleString("th-TH"), 
          product: selectedProductForForecast === "all" ? "ภาพรวมทั้งหมด" : selectedProductForForecast,
          sales: inputSales,
          profit: predictedProfit,
          mae: regressionModel.mae,
          actualProfit: null
      };
      const updatedHistory = [newRecord, ...predictionHistory];
      setPredictionHistory(updatedHistory);
      localStorage.setItem("prediction_history", JSON.stringify(updatedHistory));
  };

  const handleUpdateActualProfit = (id) => {
      setModal({
          isOpen: true,
          type: 'prompt',
          title: 'ระบุกำไรสุทธิที่เกิดขึ้นจริง (บาท)',
          text: 'เมื่อยอดขายถึงเป้าหมายที่ตั้งไว้ คุณได้กำไรจริงเท่าไหร่?',
          value: '',
          targetId: id
      });
  };

  const closeCustomModal = () => setModal({ ...modal, isOpen: false });

  const confirmCustomModal = () => {
      if (modal.type === 'prompt') {
          const actual = modal.value;
          if (actual !== undefined && actual !== "") {
              const updatedHistory = predictionHistory.map(h => 
                  h.id === modal.targetId ? { ...h, actualProfit: Number(actual) } : h
              );
              setPredictionHistory(updatedHistory);
              localStorage.setItem("prediction_history", JSON.stringify(updatedHistory));
          }
      }
      closeCustomModal();
  };
  
  const handleDeletePrediction = (id) => {
      const updatedHistory = predictionHistory.filter(h => h.id !== id);
      setPredictionHistory(updatedHistory);
      localStorage.setItem("prediction_history", JSON.stringify(updatedHistory));
  };

  const filteredData = useMemo(() => {
    let data = [...rawTransactions];
    if (dateRange.start) data = data.filter((d) => d.date >= dateRange.start);
    if (dateRange.end) data = data.filter((d) => d.date <= dateRange.end);
    return data;
  }, [rawTransactions, dateRange]);

  const productsList = useMemo(() => {
    const prods = new Set(rawTransactions.map((t) => t.product));
    return ["all", ...Array.from(prods)];
  }, [rawTransactions]);

  const kpiData = useMemo(() => {
    const now = new Date();
    let data = rawTransactions;

    if (basicFilterRange === "custom") {
      if (basicDateRange.start) {
        data = data.filter((t) => t.date >= basicDateRange.start);
      }
      if (basicDateRange.end) {
        data = data.filter((t) => t.date <= basicDateRange.end);
      }
    } else if (basicFilterRange === "today") {
      data = data.filter(
        (t) => t.dateObj.toDateString() === now.toDateString(),
      );
    } else if (basicFilterRange === "7days") {
      const d = new Date(now);
      d.setDate(now.getDate() - 7);
      data = data.filter((t) => t.dateObj >= d);
    } else if (basicFilterRange === "this_month") {
      data = data.filter(
        (t) =>
          t.dateObj.getMonth() === now.getMonth() &&
          t.dateObj.getFullYear() === now.getFullYear(),
      );
    } else if (basicFilterRange === "this_quarter") {
      // ✅ เพิ่มตรรกะการกรองข้อมูลไตรมาส (Quarter)
      const currentQuarter = Math.floor(now.getMonth() / 3);
      data = data.filter((t) => {
        const tQuarter = Math.floor(t.dateObj.getMonth() / 3);
        return (
          tQuarter === currentQuarter &&
          t.dateObj.getFullYear() === now.getFullYear()
        );
      });
    } else if (basicFilterRange === "this_year") {
      data = data.filter((t) => t.dateObj.getFullYear() === now.getFullYear());
    }

    const totalSales = data.reduce((s, i) => s + i.sales, 0);
    const totalProfit = data.reduce((s, i) => s + i.profit, 0);
    const totalCost = data.reduce((s, i) => s + i.cost, 0);

    const grouped = data.reduce((acc, item) => {
      let key = item[basicDimension] || "อื่นๆ";
      if (!acc[key]) acc[key] = 0;
      acc[key] += item.sales;
      return acc;
    }, {});

    const trendMap = {};
    data.forEach((t) => {
      const key = t.dateObj.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
      });
      trendMap[key] = (trendMap[key] || 0) + t.sales;
    });

    return {
      totalSales,
      totalProfit,
      totalCost,
      chartData: { x: Object.keys(grouped), y: Object.values(grouped) },
      trendMap,
    };
  }, [
    rawTransactions,
    basicFilterRange,
    basicDateRange,
    basicDimension,
    products,
  ]);

  const advancedData = useMemo(() => {
    let data = [...filteredData];
    Object.keys(activeFilters).forEach((key) => {
      const selectedValues = activeFilters[key];
      if (selectedValues && selectedValues.length > 0) {
        data = data.filter((i) => selectedValues.includes(i[key]));
      }
    });

    let xValues;
    if (advDimension === "month") {
      const monthYearPairs = data.map(i => ({ m: i.month, y: i.year }));
      const uniquePairs = Array.from(new Set(monthYearPairs.map(p => `${p.y}-${p.m}`)))
        .map(s => {
          const [y, m] = s.split('-').map(Number);
          return { y, m };
        })
        .sort((a, b) => a.y !== b.y ? a.y - b.y : a.m - b.m);
      
      xValues = uniquePairs.map(p => `${monthNamesThai[p.m]} ${p.y + 543}`); 
    } else if (advDimension === "year") {
      xValues = [...new Set(data.map((i) => i.year + 543))].sort(); 
    } else {
      xValues = [...new Set(data.map((i) => i[advDimension] || "ไม่ระบุ"))].sort();
    }

    const legendValues =
      advLegend === "none"
        ? ["รวมทั้งหมด"]
        : [...new Set(data.map((i) => i[advLegend] || "ไม่ระบุ"))].sort();

    const series = legendValues.map((seriesName) => {
      const seriesData = xValues.map((xVal) => {
        const matched = data.filter((d) => {
          let dVal;
          if (advDimension === "month") dVal = `${monthNamesThai[d.month]} ${d.year + 543}`;
          else if (advDimension === "year") dVal = d.year + 543;
          else dVal = d[advDimension];
          
          return (
            dVal === xVal &&
            (advLegend === "none" ? true : d[advLegend] === seriesName)
          );
        });
        if (!matched.length) return 0;
        const isAvg = advMeasure.startsWith("avg_");
        const rawMeasure = advMeasure.replace("avg_", "");
        const sum = matched.reduce((a, b) => a + Number(b[rawMeasure] || 0), 0);
        return isAvg ? sum / matched.length : sum;
      });
      return {
        name: String(seriesName),
        type: advChartType,
        data: seriesData,
        stack:
          advChartType === "bar" && advLegend !== "none" ? "total" : undefined,
        smooth: true,
      };
    });

    const tableData = xValues.map((xVal, i) => {
      const row = { name: xVal, total: 0 };
      series.forEach((s) => {
        const val = s.data[i] || 0;
        row[s.name] = val;
        row.total += val;
      });
      return row;
    });
    return { xValues, series, tableData };
  }, [
    filteredData,
    activeFilters,
    advDimension,
    advMeasure,
    advLegend,
    advChartType,
  ]);

  const getBasicOption = () => {
    const pieData = kpiData.chartData.x.map((label, idx) => ({
      value: kpiData.chartData.y[idx],
      name: label,
    }));
    return {
      tooltip: {
        trigger: "item",
        formatter: "<b>{b}</b><br/>ยอดขาย: {c} บาท ({d}%)", // ✅ เพิ่มหน่วยบาท
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "#e2e8f0",
        textStyle: { color: "#334155", fontFamily: "Prompt" },
      },
      legend: {
        bottom: "0%",
        left: "center",
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontFamily: "Prompt" },
      },
      color: [
        "#6366f1",
        "#8b5cf6",
        "#ec4899",
        "#f43f5e",
        "#f59e0b",
        "#10b981",
        "#06b6d4",
        "#3b82f6",
      ],
      series: [
        {
          name: "ยอดขาย",
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: "#fff",
            borderWidth: 2,
          },
          label: { show: false, position: "center" },
          emphasis: {
            label: { show: true, fontSize: "18", fontWeight: "bold" },
          },
          data: pieData,
        },
      ],
    };
  };

  const getKPIChartOption = () => ({
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) => Number(value).toLocaleString() + " บาท", // ✅ เพิ่มหน่วยบาทใน Tooltip
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#e2e8f0",
      textStyle: { color: "#334155", fontFamily: "Prompt" },
    },
    grid: {
      left: "2%",
      right: "2%",
      bottom: "2%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: Object.keys(kpiData.trendMap),
      boundaryGap: false,
      axisLabel: { color: "#64748b", fontFamily: "Prompt" },
      axisLine: { lineStyle: { color: "#e2e8f0" } },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { type: "dashed", color: "#f1f5f9" } },
      axisLabel: { 
        color: "#94a3b8", 
        fontFamily: "Prompt",
        formatter: "{value} บ." // ✅ เพิ่มหน่วยที่แกน Y
      },
    },
    series: [
      {
        data: Object.values(kpiData.trendMap),
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        itemStyle: { color: "#f59e0b", borderColor: "#fff", borderWidth: 2 },
        lineStyle: { width: 4, color: "#f59e0b" },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(245, 158, 11, 0.4)" },
            { offset: 1, color: "rgba(245, 158, 11, 0.0)" },
          ]),
        },
      },
    ],
  });

  const getAdvancedOption = () => {
    const unit = advMeasure === "quantity" ? "ชิ้น" : "บาท"; // เลือกหน่วยให้ถูกต้อง
    if (advChartType === "pie") {
      let pieData;
      if (advLegend === "none") {
        pieData = advancedData.xValues.map((xVal, i) => ({
          name: xVal,
          value: advancedData.series[0].data[i],
        }));
      } else {
        pieData = advancedData.series.map((s) => ({
          name: s.name,
          value: s.data.reduce((a, b) => a + Number(b), 0),
        }));
      }
      return {
        tooltip: {
          trigger: "item",
          formatter: `<b>{b}</b><br/>{c} ${unit} ({d}%)`, // ✅ เพิ่มหน่วย
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          textStyle: { fontFamily: "Prompt" },
        },
        legend: {
          bottom: 0,
          type: "scroll",
          textStyle: { fontFamily: "Prompt" },
        },
        series: [
          {
            type: "pie",
            radius: "70%",
            data: pieData,
            itemStyle: {
              borderRadius: 5,
              borderColor: "#fff",
              borderWidth: 2,
            },
            label: { show: false },
            emphasis: { label: { show: true, fontWeight: "bold" } },
          },
        ],
      };
    }
    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        valueFormatter: (value) => Number(value).toLocaleString() + ` ${unit}`, // ✅ เพิ่มหน่วย
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        textStyle: { fontFamily: "Prompt" },
      },
      legend: {
        top: 30,
        type: "scroll",
        textStyle: { fontFamily: "Prompt" },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "10%",
        top: "20%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: advancedData.xValues,
        axisLabel: {
          rotate: 45,
          interval: 0,
          color: "#64748b",
          fontFamily: "Prompt",
        },
        axisLine: { lineStyle: { color: "#e2e8f0" } },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { type: "dashed", color: "#f1f5f9" } },
        axisLabel: { 
          color: "#94a3b8", 
          fontFamily: "Prompt",
          formatter: `{value} ${unit === 'บาท' ? 'บ.' : 'ชิ้น'}` // ✅ เพิ่มหน่วย
        },
      },
      series: advancedData.series.map((s, idx) => ({
        ...s,
        type: advChartType,
        barMaxWidth: 60,
        smooth: true,
        itemStyle: {
          borderRadius: advChartType === "bar" ? [4, 4, 0, 0] : 0,
        },
      })),
    };
  };

  const getScatterOption = () => {
    let data = rawTransactions;
    if (selectedProductForForecast !== "all") {
      data = data.filter((t) => t.product === selectedProductForForecast);
    }
    const points = data.map((t) => [t.sales, t.profit]);

    const minX = 0;
    const maxX = Math.max(...points.map((p) => p[0]), inputSales) * 1.1 || 1000;
    const lineData = [
      [minX, regressionModel.a * minX + regressionModel.b],
      [maxX, regressionModel.a * maxX + regressionModel.b],
    ];

    return {
      tooltip: {
        trigger: "item",
        formatter: function (params) {
          if (params.seriesName === "Linear Regression") return params.seriesName;
          if (params.value && params.value.length >= 2) {
             return `<b>${params.seriesName}</b><br/>ยอดขาย: ${Number(params.value[0]).toLocaleString()} บาท<br/>กำไร: ${Number(params.value[1]).toLocaleString()} บาท`;
          }
          return params.name;
        }
      },
      legend: {
        bottom: 0,
        type: 'scroll',
        data: ["ข้อมูลจริง", "Linear Regression", "จุดคาดการณ์"],
        textStyle: { fontFamily: "Prompt", color: "#64748b", fontSize: 10 },
      },
      grid: { top: "10%", right: "8%", bottom: "20%", left: "5%", containLabel: true },
      xAxis: {
        name: "ยอดขาย (x)",
        nameLocation: "middle",
        nameGap: 30,
        type: "value",
        splitLine: { lineStyle: { type: "dashed", color: "#e2e8f0" } },
        axisLabel: { fontFamily: "Prompt", fontSize: 10 },
      },
      yAxis: {
        name: "กำไร (y)",
        nameLocation: "end",
        type: "value",
        splitLine: { lineStyle: { type: "dashed", color: "#e2e8f0" } },
        axisLabel: { fontFamily: "Prompt", fontSize: 10 },
      },
      series: [
        {
          type: "scatter",
          name: "ข้อมูลจริง",
          data: points,
          symbolSize: 8,
          itemStyle: { color: "#6366f1", opacity: 0.8 },
        },
        {
          type: "line",
          name: "Linear Regression",
          data: lineData,
          smooth: false,
          symbol: "none",
          lineStyle: { type: "dashed", color: "#ec4899", width: 2 },
        },
        {
          type: "scatter",
          name: "จุดคาดการณ์",
          data: [[inputSales, predictedProfit]],
          symbol: "pin",
          symbolSize: 24,
          itemStyle: { 
            color: "#f59e0b",
            shadowBlur: 10,
            shadowColor: "rgba(245,158,11,0.5)"
          },
          zlevel: 10,
        },
      ],
    };
  };

  const addSlicer = (id) => {
    if (!visibleSlicers.includes(id))
      setVisibleSlicers([...visibleSlicers, id]);
    setShowAddSlicerMenu(false);
  };
  const removeSlicer = (id) => {
    setVisibleSlicers(visibleSlicers.filter((s) => s !== id));
    const n = { ...activeFilters };
    delete n[id];
    setActiveFilters(n);
  };
  const getUniqueValues = (key) =>
    [...new Set(rawTransactions.map((i) => i[key]))].sort();
  const toggleFilterValue = (slicerId, value) => {
    const current = activeFilters[slicerId] || [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setActiveFilters({ ...activeFilters, [slicerId]: next });
  };
  
  const handleExport = () => {
    let data = [];
    const exportTime = new Date().toLocaleString("th-TH"); 
    const reportTypeLabel = {
      basic: "รายงานวิเคราะห์เป้าหมาย",
      advanced: "รายงานวิเคราะห์เชิงลึก",
      forecast: "รายงานคาดการณ์ผลประกอบการ"
    }[viewMode];

    if (viewMode === "basic") {
      data = kpiData.chartData.x.map((label, i) => ({
        'มิติข้อมูลหลัก': basicDimension === 'category' ? 'หมวดหมู่สินค้า' : 'ชื่อสินค้า',
        'ชื่อกลุ่ม/รายการ': label,
        'ยอดขายรวม (บาท)': kpiData.chartData.y[i],
        'สัดส่วนจากทั้งหมด (%)': ((kpiData.chartData.y[i] / (kpiData.totalSales || 1)) * 100).toFixed(2)
      }));
    } else if (viewMode === "advanced") {
      data = advancedData.tableData.map(row => {
        const newRow = {
          'มิติที่ใช้แบ่งกลุ่ม': dimensionOptions.find(d => d.id === advDimension)?.label,
          'ชื่อกลุ่ม/รายการ': row.name,
        };
        advancedData.series.forEach(s => {
          newRow[`ข้อมูล: ${s.name}`] = row[s.name] || 0;
        });
        newRow['ยอดรวมทั้งสิ้น (บาท)'] = row.total; // เพิ่มหน่วย (บาท) ให้เห็นชัดเจน
        return newRow;
      });
    } else if (viewMode === "forecast") {
      data = predictionHistory.map(h => {
        const hasActual = h.actualProfit !== undefined && h.actualProfit !== null;
        return {
          'วันเวลาที่ทำนาย': h.timestamp,
          'ชื่อกลุ่ม/สินค้า': h.product,
          'เป้ายอดขาย (x)': h.sales,
          'คาดการณ์กำไร (y)': h.profit.toFixed(2),
          'กำไรจริงที่เกิดขึ้น': hasActual ? h.actualProfit : '-',
          'ผลต่างกำไร': hasActual ? (h.actualProfit - h.profit).toFixed(2) : '-'
        };
      });
    }

    if (data && data.length > 0) {
      const headers = Object.keys(data[0]);
      
      const metaRows = [
        ["รายงานวิเคราะห์ข้อมูลธุรกิจ (BI Report)"],
        [`กลุ่มวิสาหกิจ: ${orgName || "วิสาหกิจB"}`],
        [`ประเภทรายงาน: ${reportTypeLabel}`],
        [`วันที่ออกรายงาน: ${exportTime}`],
        [""] 
      ];

      const csvContent = [
        ...metaRows.map(row => row.join(",")),
        headers.join(","),
        ...data.map(row => headers.map(fieldName => {
          let cellData = row[fieldName] === null || row[fieldName] === undefined ? "" : row[fieldName];
          cellData = String(cellData).replace(/"/g, '""');
          if (cellData.search(/("|,|\n)/g) >= 0) cellData = `"${cellData}"`;
          return cellData;
        }).join(","))
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); 
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Report_${viewMode}_${new Date().getTime()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
        setModal({
            isOpen: true,
            type: 'alert',
            title: 'ไม่มีข้อมูล',
            text: 'กรุณาตรวจสอบการเลือกตัวกรองก่อนการส่งออก',
            value: '',
            targetId: null
        });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target))
        setShowAddSlicerMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="animate-spin" size={48} />
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center shadow-sm gap-4 shrink-0 z-30 relative">
        <div className="flex items-center gap-4">
          <div
            className={`p-2 rounded-xl ${viewMode === "basic" ? "bg-indigo-50 text-indigo-700" : viewMode === "advanced" ? "bg-purple-50 text-purple-700" : "bg-emerald-50 text-emerald-700"}`}
          >
            {viewMode === "basic" && <Activity size={24} />}
            {viewMode === "advanced" && <Layers size={24} />}
            {viewMode === "forecast" && <TrendingUp size={24} />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tight">
              รายงานวิเคราะห์
            </h1>
            <p className="text-xs text-slate-500 font-medium">กลุ่มวิสาหกิจ: <span className="font-bold text-indigo-600">{orgName}</span></p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex overflow-x-auto w-full md:w-auto custom-scrollbar">
          <button
            onClick={() => setViewMode("basic")}
            className={`px-5 py-2 rounded-xl text-sm font-black flex items-center gap-2 transition-all ${viewMode === "basic" ? "bg-white text-indigo-600 shadow-md" : "text-slate-500 hover:text-indigo-600"}`}
          >
            <LayoutDashboard size={16} />
            วิเคราะห์เป้าหมาย
          </button>
          <button
            onClick={() => setViewMode("advanced")}
            className={`px-5 py-2 rounded-xl text-sm font-black flex items-center gap-2 transition-all ${viewMode === "advanced" ? "bg-white text-purple-600 shadow-md" : "text-slate-500 hover:text-purple-600"}`}
          >
            <Settings2 size={16} /> วิเคราะห์ขั้นสูง
          </button>
          <button
            onClick={() => setViewMode("forecast")}
            className={`px-5 py-2 rounded-xl text-sm font-black flex items-center gap-2 transition-all ${viewMode === "forecast" ? "bg-white text-emerald-600 shadow-md" : "text-slate-500 hover:text-emerald-600"}`}
          >
            <TrendingUp size={16} /> โมเดลคาดการณ์
          </button>
        </div>

        <div className="flex gap-3 items-center w-full md:w-auto">
          {viewMode === "advanced" && (
            <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200 shadow-sm hidden md:flex">
              <input
                type="date"
                className="bg-transparent text-xs p-1.5 outline-none text-slate-600 font-bold"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
              />
              <span className="text-slate-300 mx-1 text-xs">ถึง</span>
              <input
                type="date"
                className="bg-transparent text-xs p-1.5 outline-none text-slate-600 font-bold"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
              />
            </div>
          )}
          
          <button
            onClick={handleExport}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95 font-black text-sm"
          >
            <FileSpreadsheet size={20} />
            <span>ส่งออก Excel</span>
          </button>
        </div>
      </div>

      <div className="p-4 md:p-8 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
        
        {viewMode === "forecast" && (
          <div className="animate-in fade-in zoom-in duration-300 space-y-8 max-w-7xl mx-auto pb-24">
            <div className="bg-gradient-to-br from-indigo-700 via-violet-700 to-indigo-900 rounded-[3rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-12 -translate-y-12">
                <Zap size={250} />
              </div>

              <div className="relative z-10 flex flex-col md:grid md:grid-cols-2 gap-10 md:gap-16 items-center">
                <div className="w-full space-y-8">
                  <div>
                    <h2 className="text-3xl md:text-5xl font-black mb-3 tracking-tighter leading-tight">
                      คาดการณ์กำไรอัจฉริยะ
                    </h2>
                    <p className="text-indigo-100 text-sm font-medium opacity-80">
                      ใช้สถิติยอดขายจริงมาคำนวณผ่าน Linear Regression Model <br/>
                      สูตร: <span className="font-mono text-yellow-300 font-bold tracking-widest">y = ax + b</span>
                    </p>
                  </div>
                  <div className="space-y-5 bg-white/10 p-6 rounded-[2rem] border border-white/20 backdrop-blur-xl">
                    <div>
                      <label className="text-xs font-black text-indigo-100 mb-2.5 block ml-1 uppercase tracking-widest">ขอบเขตข้อมูล (Scope)</label>
                      <select
                        value={selectedProductForForecast}
                        onChange={(e) =>
                          setSelectedProductForForecast(e.target.value)
                        }
                        className="w-full bg-white text-slate-800 rounded-2xl px-5 py-4 outline-none cursor-pointer font-black text-sm transition-all focus:ring-4 focus:ring-white/30"
                      >
                        <option value="all">ภาพรวมทุกสินค้า</option>
                        {productsList
                          .filter((p) => p !== "all")
                          .map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-black text-indigo-100 mb-2.5 block ml-1 uppercase tracking-widest">ระบุเป้ายอดขายที่ต้องการ (x)</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-indigo-50 text-indigo-700 rounded-xl transition-all group-focus-within:bg-indigo-600 group-focus-within:text-white">
                          <DollarSign size={20} />
                        </div>
                        <input
                          type="number"
                          value={inputSales}
                          onChange={(e) =>
                            setInputSales(Number(e.target.value))
                          }
                          className="w-full bg-white text-indigo-950 font-black text-2xl pl-16 pr-16 py-4.5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-400/50 shadow-2xl"
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black">THB</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full">
                  <div className="bg-white/10 backdrop-blur-md rounded-[3rem] p-10 md:p-14 border border-white/20 text-center relative overflow-hidden group shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <p className="text-indigo-100 font-black mb-4 text-xs relative z-10 uppercase tracking-[0.2em] opacity-70">
                      กำไรที่คาดการณ์ได้ (y)
                    </p>

                    <div className="relative z-10 mb-6">
                      <div
                        className={`text-8xl md:text-9xl font-black tracking-tighter drop-shadow-2xl ${predictedProfit >= 0 ? "text-white" : "text-red-400"}`}
                      >
                        {Math.round(predictedProfit).toLocaleString()}
                      </div>
                      <div className="text-lg font-black text-indigo-200 mt-4 tracking-widest opacity-80">
                        บาท (THB)
                      </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/10 text-center relative z-10">
                      <div className="inline-flex items-center gap-2 bg-black/30 rounded-full px-6 py-2.5 backdrop-blur-xl mb-4 border border-white/10">
                        <p className="text-[10px] text-indigo-50 font-mono tracking-widest uppercase">
                          Model: y = <span className="text-yellow-400 font-bold">{regressionModel.a.toFixed(3)}</span>(x) + <span className="text-pink-400 font-bold">{regressionModel.b.toFixed(2)}</span>
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <p className="text-[11px] text-emerald-300 font-black flex items-center gap-2 bg-emerald-950/30 px-4 py-1.5 rounded-full border border-emerald-500/20 shadow-sm">
                          <CheckCircle2 size={14} /> ความคลาดเคลื่อน (MAE): ± {regressionModel.mae.toLocaleString(undefined, { maximumFractionDigits: 2 })} บ.
                        </p>
                        {regressionModel.isEstimate && (
                          <span className="text-[9px] text-orange-400 font-bold mt-2 italic">* อ้างอิงจากค่าเฉลี่ยสัดส่วนกำไรรายสินค้า</span>
                        )}
                      </div>
                    </div>
                    
                    <button
                        onClick={handleSavePrediction}
                        className="mt-10 bg-white text-indigo-700 hover:bg-indigo-50 text-sm font-black py-4 px-10 rounded-[1.5rem] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3 mx-auto relative z-10"
                    >
                        <Save size={20} /> บันทึกผลการทำนาย
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col transition-all hover:shadow-2xl hover:shadow-slate-200/50">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-slate-800 flex items-center gap-4 text-xl">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm">
                        <TrendingUp size={24} />
                      </div>
                      จุดความสัมพันธ์ (Scatter)
                    </h3>
                  </div>
                  <div className="h-[400px] w-full flex-1">
                    <ReactECharts
                      option={getScatterOption()}
                      style={{ height: "100%", width: "100%" }}
                      notMerge={true}
                      opts={{ renderer: 'svg' }}
                    />
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col transition-all hover:shadow-2xl hover:shadow-slate-200/50">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-slate-800 flex items-center gap-4 text-xl">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm">
                        <Clock size={24} />
                      </div>
                      ประวัติการทำนาย
                    </h3>
                    {predictionHistory.length > 0 && (
                      <button 
                        onClick={() => {
                            setPredictionHistory([]);
                            localStorage.removeItem("prediction_history");
                        }} 
                        className="text-xs text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl font-black transition-colors"
                      >
                        ล้างข้อมูลทั้งหมด
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar pr-1 max-h-[420px]">
                    <table className="w-full text-left text-xs min-w-[700px] border-separate border-spacing-y-3">
                      <thead className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm">
                        <tr>
                          <th className="p-5 text-slate-400 font-black uppercase tracking-widest text-[10px]">ชื่อกลุ่ม / สินค้า</th>
                          <th className="p-5 text-slate-400 font-black uppercase tracking-widest text-[10px] text-right">ยอดขาย (x)</th>
                          <th className="p-5 text-slate-400 font-black uppercase tracking-widest text-[10px] text-right">คาดการณ์ (y)</th>
                          <th className="p-5 text-slate-400 font-black uppercase tracking-widest text-[10px] text-right">กำไรจริง</th>
                          <th className="p-5 text-slate-400 font-black uppercase tracking-widest text-[10px] text-right text-indigo-600">ผลต่าง</th>
                          <th className="p-5 text-center"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {predictionHistory.length === 0 ? (
                           <tr>
                               <td colSpan="6" className="text-center p-16 text-slate-300 bg-slate-50/50 rounded-[2.5rem]">
                                 <AlertTriangle size={48} className="mx-auto mb-4 opacity-10" />
                                 <p className="font-black uppercase tracking-tighter">ยังไม่มีประวัติการทำนายในระบบ</p>
                               </td>
                           </tr>
                        ) : (
                           predictionHistory.map((h) => {
                             const hasActual = h.actualProfit !== undefined && h.actualProfit !== null;
                             const actualError = hasActual ? Math.abs(h.actualProfit - h.profit) : null;
                             
                             return (
                             <tr key={h.id} className="bg-white hover:bg-slate-50/80 transition-all border border-slate-100 shadow-sm rounded-2xl group">
                                <td className="p-5 rounded-l-2xl border-l-4 border-l-transparent group-hover:border-l-indigo-500">
                                    <div className="font-black text-slate-800 text-sm truncate max-w-[180px]">{h.product}</div>
                                    <div className="text-[10px] text-slate-400 font-bold mt-1 tracking-tight">{h.timestamp}</div>
                                </td>
                                <td className="p-5 text-right font-black text-slate-500">
                                  {h.sales.toLocaleString()} <span className="text-[9px] font-medium ml-0.5 text-slate-400">บาท</span>
                                </td>
                                <td className="p-5 text-right">
                                    <div className="font-black text-indigo-600 text-sm">
                                      {h.profit.toLocaleString(undefined, {maximumFractionDigits: 0})} <span className="text-[9px] font-medium ml-0.5">บาท</span>
                                    </div>
                                    <div className="text-[9px] text-slate-400 font-bold uppercase mt-1">MAE ±{h.mae.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                                </td>
                                <td className="p-5 text-right">
                                    {hasActual ? (
                                        <span className="font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 shadow-sm">
                                          {h.actualProfit.toLocaleString()} <span className="text-[9px] font-medium ml-0.5">บาท</span>
                                        </span>
                                    ) : (
                                        <button 
                                            onClick={() => handleUpdateActualProfit(h.id)} 
                                            className="text-[10px] font-black text-indigo-600 border-2 border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 px-4 py-2 rounded-xl transition-all"
                                        >
                                            ระบุตัวเลขจริง
                                        </button>
                                    )}
                                </td>
                                <td className="p-5 text-right font-black">
                                    {hasActual ? (
                                        <span className={actualError > h.mae ? 'text-red-500' : 'text-emerald-500'}>
                                            {actualError.toLocaleString(undefined, {maximumFractionDigits: 0})} <span className="text-[9px] font-medium ml-0.5">บาท</span>
                                        </span>
                                    ) : "-"}
                                </td>
                                <td className="p-5 text-center rounded-r-2xl">
                                   <button 
                                     onClick={() => handleDeletePrediction(h.id)} 
                                     className="text-slate-200 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-all"
                                   >
                                       <X size={18}/>
                                   </button>
                                </td>
                             </tr>
                           )})
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
            </div>
          </div>
        )}

        {viewMode === "basic" && (
          <div className="animate-in fade-in zoom-in duration-300 max-w-7xl mx-auto pb-24">
            <div className="flex flex-col xl:flex-row justify-between items-end gap-5 mb-10">
              <div className="flex flex-wrap items-center gap-4 w-full">
                <div className="flex items-center bg-white px-4 py-2 rounded-[1.2rem] border border-slate-200 shadow-sm flex-1 md:flex-none">
                  <input
                    type="date"
                    className="bg-transparent text-xs p-1 outline-none text-slate-800 font-black"
                    value={basicDateRange.start}
                    onChange={(e) => {
                      setBasicDateRange({ ...basicDateRange, start: e.target.value });
                      setBasicFilterRange("custom");
                    }}
                  />
                  <span className="text-slate-300 mx-3 text-xs font-bold uppercase">ถึง</span>
                  <input
                    type="date"
                    className="bg-transparent text-xs p-1 outline-none text-slate-800 font-black"
                    value={basicDateRange.end}
                    onChange={(e) => {
                      setBasicDateRange({ ...basicDateRange, end: e.target.value });
                      setBasicFilterRange("custom");
                    }}
                  />
                </div>
                <div className="flex bg-white p-1.5 rounded-[1.2rem] border border-slate-200 shadow-sm overflow-x-auto w-full md:w-auto custom-scrollbar">
                  {[
                    { id: "today", label: "วันนี้" },
                    { id: "this_month", label: "เดือนนี้" },
                    { id: "this_quarter", label: "ไตรมาสนี้" }, // ✅ เพิ่มปุ่ม ไตรมาสนี้
                    { id: "this_year", label: "ปีนี้" },
                    { id: "all", label: "ทั้งหมด" },
                  ].map((range) => (
                    <button
                      key={range.id}
                      onClick={() => {
                        setBasicFilterRange(range.id);
                        setBasicDateRange({ start: "", end: "" });
                      }}
                      className={`px-6 py-2 text-xs font-black rounded-xl transition-all whitespace-nowrap ${basicFilterRange === range.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-[1.2rem] border border-slate-200 shadow-sm flex-1 md:flex-none">
                  <Flag size={14} className="text-orange-500" />
                  <span className="text-xs text-slate-400 font-black uppercase tracking-tighter">เป้า:</span>
                  <select
                    className="bg-transparent text-xs font-black text-slate-800 outline-none cursor-pointer w-full"
                    value={targetPeriod}
                    onChange={(e) => setTargetPeriod(e.target.value)}
                  >
                    <option value="this_month">เป้าหมายเดือนนี้</option>
                    <option value="this_quarter">เป้าหมายไตรมาสนี้</option> {/* ✅ เพิ่ม Dropdown ของเป้าไตรมาส */}
                    <option value="this_year">เป้าหมายปีนี้</option>
                    <option value="all_time">เป้าหมายทั้งหมด</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => isEditingTargets ? handleSaveTargets() : setIsEditingTargets(true)}
                className={`text-xs px-6 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-xl w-full md:w-auto ${isEditingTargets ? "bg-emerald-500 text-white hover:bg-emerald-600 scale-105" : "bg-white text-slate-800 hover:border-indigo-500 border border-slate-200"}`}
              >
                {isEditingTargets ? <Save size={18} /> : <Edit3 size={18} />}
                {isEditingTargets ? "บันทึกตัวเลขเป้าหมาย" : "ตั้งค่าเป้าหมาย"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              <KPICardWithTarget
                title="ยอดขายรวม"
                value={kpiData.totalSales}
                target={targets[targetPeriod]?.sales}
                color="text-indigo-800"
                bg="bg-indigo-50"
                bar="bg-indigo-600"
                icon={DollarSign}
                isEditing={isEditingTargets}
                onTargetChange={(val) => handleTargetChange("sales", val)}
              />
              <KPICardWithTarget
                title="กำไรสุทธิ"
                value={kpiData.totalProfit}
                target={targets[targetPeriod]?.profit}
                color="text-emerald-800"
                bg="bg-emerald-50"
                bar="bg-emerald-600"
                icon={Wallet}
                isEditing={isEditingTargets}
                onTargetChange={(val) => handleTargetChange("profit", val)}
              />
              <KPICardWithTarget
                title="ต้นทุนรวม"
                value={kpiData.totalCost}
                target={targets[targetPeriod]?.cost}
                color="text-orange-800"
                bg="bg-orange-50"
                bar="bg-orange-600"
                icon={Coins}
                isEditing={isEditingTargets}
                onTargetChange={(val) => handleTargetChange("cost", val)}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                <h3 className="font-black mb-8 text-slate-800 text-xl flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <TrendingUp size={24} />
                  </div>
                  แนวโน้มผลประกอบการ
                </h3>
                <div className="h-[350px]">
                  <ReactECharts
                    option={getKPIChartOption()}
                    style={{ height: "100%", width: "100%" }}
                    notMerge={true}
                  />
                </div>
              </div>
              <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-8">
                  <h3 className="font-black text-slate-800 text-xl flex items-center gap-3">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                      <PieIcon size={24} />
                    </div>
                    สัดส่วนแบ่งตามกลุ่ม
                  </h3>
                  <select
                    value={basicDimension}
                    onChange={(e) => setBasicDimension(e.target.value)}
                    className="text-xs font-black border-2 border-slate-100 rounded-xl px-4 py-2.5 bg-slate-50 w-full sm:w-auto outline-none focus:border-indigo-200"
                  >
                    <option value="category">หมวดหมู่สินค้า</option>
                    <option value="product">ชื่อสินค้า</option>
                  </select>
                </div>
                <div className="h-[350px]">
                  <ReactECharts
                    ref={chartRef}
                    option={getBasicOption()}
                    style={{ height: "100%", width: "100%" }}
                    notMerge={true}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === "advanced" && (
          <div className="grid grid-cols-12 gap-10 animate-in fade-in zoom-in duration-300 max-w-7xl mx-auto pb-24">
            <div className="col-span-12 md:col-span-3 space-y-8">
              <div className="bg-white p-6 rounded-[2.5rem] border border-purple-100 shadow-sm">
                <h3 className="font-black text-slate-800 text-sm mb-6 flex items-center gap-3">
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                    <Settings2 size={20} />
                  </div>
                  ตั้งค่ารายงาน
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">แบ่งกลุ่มตามมิติ (X)</label>
                    <select
                      value={advDimension}
                      onChange={(e) => setAdvDimension(e.target.value)}
                      className="w-full text-xs font-black p-3.5 border-2 border-slate-50 rounded-2xl bg-slate-50 outline-none focus:border-purple-300 focus:bg-white transition-all"
                    >
                      {dimensionOptions.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">ข้อมูลตัวเลขหลัก</label>
                    <select
                      value={advMeasure}
                      onChange={(e) => setAdvMeasure(e.target.value)}
                      className="w-full text-xs font-black p-3.5 border-2 border-slate-50 rounded-2xl bg-slate-50 outline-none focus:border-purple-300 focus:bg-white transition-all"
                    >
                      {metricOptions.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">เปรียบเทียบตามสี</label>
                    <select
                      value={advLegend}
                      onChange={(e) => setAdvLegend(e.target.value)}
                      className="w-full text-xs font-black p-3.5 border-2 border-slate-50 rounded-2xl bg-slate-50 outline-none focus:border-purple-300 focus:bg-white transition-all"
                    >
                      <option value="none">-- รวมทั้งหมด --</option>
                      {dimensionOptions.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-slate-800 text-sm flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Filter size={20} />
                    </div>
                    ตัวกรอง (Slicer)
                  </h3>
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setShowAddSlicerMenu(!showAddSlicerMenu)}
                      className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                    >
                      <Plus size={18} />
                    </button>
                    {showAddSlicerMenu && (
                      <div className="absolute right-0 mt-3 w-52 bg-white border border-slate-100 shadow-2xl rounded-2xl z-50 p-2.5 animate-in slide-in-from-top-2 duration-200">
                        {dimensionOptions
                          .filter((o) => !visibleSlicers.includes(o.id))
                          .map((o) => (
                            <button
                              key={o.id}
                              onClick={() => addSlicer(o.id)}
                              className="block w-full text-left text-xs font-black p-3 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-all"
                            >
                              {o.label}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-5">
                  {visibleSlicers.length === 0 && <p className="text-center text-[10px] text-slate-300 py-6 font-bold uppercase tracking-widest">ยังไม่ได้เลือกตัวกรอง</p>}
                  {visibleSlicers.map((key) => (
                    <div key={key} className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200">
                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">
                          {dimensionOptions.find((d) => d.id === key)?.label}
                        </span>
                        <button onClick={() => removeSlicer(key)} className="text-slate-300 hover:text-red-500"><X size={14} /></button>
                      </div>
                      <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                        {getUniqueValues(key).map((val) => (
                          <div
                            key={val}
                            onClick={() => toggleFilterValue(key, val)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer text-[11px] transition-all ${(activeFilters[key] || []).includes(val) ? "bg-indigo-600 text-white font-black shadow-md shadow-indigo-100" : "hover:bg-slate-200/50 text-slate-600 font-bold"}`}
                          >
                            {(activeFilters[key] || []).includes(val) ? <CheckSquare size={14} /> : <Square size={14} />}
                            <span className="truncate">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-span-12 md:col-span-9 space-y-10">
              <div className="bg-white p-8 md:p-10 rounded-[3.5rem] border border-slate-200 shadow-sm h-[500px]">
                <ReactECharts
                  ref={chartRef}
                  option={getAdvancedOption()}
                  style={{ height: "100%", width: "100%" }}
                  notMerge={true}
                />
              </div>
              
              <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[550px] transition-all hover:shadow-2xl hover:shadow-slate-200/50">
                <div className="p-8 px-10 bg-slate-50/50 border-b flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
                    <Table size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-xl">ตารางแสดงตามชื่อกลุ่ม (Pivot)</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ข้อมูลจำแนกตาม {dimensionOptions.find(d => d.id === advDimension)?.label}</p>
                  </div>
                </div>
                <div className="overflow-auto flex-1 custom-scrollbar">
                  <table className="w-full text-left text-xs min-w-[800px] border-collapse">
                    <thead className="bg-slate-50/80 sticky top-0 shadow-sm z-10 backdrop-blur-md">
                      <tr>
                        <th className="p-6 px-10 font-black text-slate-500 uppercase tracking-widest text-[10px] border-b">
                          ชื่อกลุ่ม / {dimensionOptions.find((d) => d.id === advDimension)?.label}
                        </th>
                        {advancedData.series.map((s, i) => (
                          <th key={i} className="p-6 text-right font-black text-slate-500 uppercase tracking-widest text-[10px] border-b">
                            {s.name}
                          </th>
                        ))}
                        <th className="p-6 text-right bg-slate-100/50 font-black text-indigo-700 uppercase tracking-widest text-[10px] border-b">
                          ยอดรวมทั้งสิ้น (บาท)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {advancedData.tableData.map((row, i) => (
                        <tr key={i} className="hover:bg-indigo-50/20 transition-colors group">
                          <td className="p-6 px-10 font-black text-slate-800 text-sm border-r border-slate-50/50">
                            {row.name}
                          </td>
                          {advancedData.series.map((s, si) => (
                            <td key={si} className="p-6 text-right text-slate-600 group-hover:text-indigo-700 font-black">
                              {row[s.name]?.toLocaleString()}
                            </td>
                          ))}
                          <td className="p-6 text-right font-black bg-slate-50/20 text-indigo-800 text-sm">
                            {row.total.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ Custom Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-xl px-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-sm p-10 animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="flex flex-col items-center text-center mb-8">
               <div className={`p-6 rounded-[2rem] mb-6 shadow-xl ${modal.type === 'alert' ? 'bg-orange-50 text-orange-500 shadow-orange-100' : 'bg-indigo-50 text-indigo-600 shadow-indigo-100'}`}>
                  {modal.type === 'alert' ? <AlertTriangle size={48} /> : <Calculator size={48} />}
               </div>
               <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tighter">{modal.title}</h3>
               <p className="text-sm text-slate-400 font-bold leading-relaxed">{modal.text}</p>
            </div>
            
            {modal.type === 'prompt' && (
              <div className="relative mb-8">
                <input 
                  type="number" 
                  className="w-full border-4 border-slate-50 bg-slate-50 rounded-[1.5rem] px-6 py-5 outline-none focus:border-indigo-500 focus:bg-white focus:ring-8 focus:ring-indigo-100 transition-all font-black text-center text-3xl text-indigo-700 shadow-inner"
                  placeholder="0.00"
                  value={modal.value}
                  onChange={(e) => setModal({...modal, value: e.target.value})}
                  autoFocus
                />
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmCustomModal}
                className="w-full py-5 text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl shadow-2xl shadow-emerald-200 transition-all active:scale-95 uppercase tracking-widest"
              >
                ยืนยันข้อมูล
              </button>
              {modal.type === 'prompt' && (
                <button 
                  onClick={closeCustomModal}
                  className="w-full py-4 text-xs font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
                >
                  ยกเลิกรายการ
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPICardWithTarget({ title, value, target = 1, color, bg, bar, icon: Icon, isEditing, onTargetChange }) {
  const percent = Math.min((value / (target || 1)) * 100, 100);
  
  return (
    <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-200/40 group">
      
      {/* ส่วนหัว: ไอคอน และ ชื่อหัวข้อ */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-3 rounded-2xl ${bg} ${color} transition-transform group-hover:scale-110 duration-300`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className={`text-2xl font-black ${color} tracking-tight`}>
            {value.toLocaleString()} 
            <span className="text-sm ml-1 opacity-50 font-medium">บาท</span>
          </h3>
        </div>
      </div>

      {/* ส่วนกลาง: Progress Bar & Percentage */}
      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">ความคืบหน้า</span>
          <span className={`text-sm font-black ${percent >= 100 ? "text-emerald-500" : color}`}>
            {percent.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${bar}`}
            style={{ width: `${percent}%` }}
          ></div>
        </div>
      </div>

      {/* ส่วนท้าย: ข้อมูลเป้าหมาย */}
      <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <Target size={14} />
          <span className="text-[10px] font-bold uppercase tracking-tight">เป้าหมาย</span>
        </div>
        
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              className="w-24 border-b border-slate-200 outline-none text-right px-1 bg-slate-50 focus:border-indigo-500 text-slate-800 font-black rounded py-0.5 text-xs"
              value={target}
              onChange={(e) => onTargetChange(Number(e.target.value))}
            />
            <span className="text-[10px] font-bold text-slate-400">บาท</span>
          </div>
        ) : (
          <span className="font-bold text-slate-700 text-xs">
            {Number(target || 0).toLocaleString()} 
            <span className="text-[10px] ml-1 text-slate-400 font-medium">บาท</span>
          </span>
        )}
      </div>

      {/* ตกแต่งพื้นหลังเล็กน้อย (Glassmorphism Effect) */}
      <div className={`absolute -right-4 -bottom-4 opacity-[0.03] ${color} group-hover:opacity-[0.08] transition-opacity`}>
        <Icon size={120} />
      </div>
    </div>
  );
}