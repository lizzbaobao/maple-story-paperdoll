"use client";
import React, { useState, useRef, useEffect } from "react";
import { readPsd } from "ag-psd";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
//楓之谷的紙娃娃一格是250*250

const walk = {
  move: [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: 2 },
    { row: 0, col: 3 },
  ],
  intervalMs: 200,
  pause: false,
  pauseMs: 0,
};

const stand1 = {
  move: [
    { row: 1, col: 0 },
    { row: 1, col: 1 },
    { row: 1, col: 2 },
  ],
  intervalMs: 200,
  pause: false,
  pauseMs: 0,
};

const stand2 = {
  move: [
    { row: 2, col: 0 },
    { row: 2, col: 1 },
    { row: 2, col: 2 },
  ],
  intervalMs: 200,
  pause: false,
  pauseMs: 0,
};

const Alert = {
  move: [
    { row: 4, col: 0 },
    { row: 4, col: 1 },
    { row: 4, col: 2 },
  ],
  intervalMs: 200,
  pause: false,
  pauseMs: 0,
};

const corsairFire = {
  move: [
    { row: 0, col: 5 },
    { row: 7, col: 8 },
  ],
  intervalMs: 300,
  pause: false,
  pauseMs: 0,
};

const corsairOctopus = {
  move: [
    { row: 11, col: 8 },
    { row: 2, col: 6 },
    { row: 9, col: 0 },
    { row: 6, col: 0 },
    { row: 10, col: 5 },
    { row: 10, col: 0 },
    { row: 8, col: 3 },
  ],
  intervalMs: 100,
  pause: true,
  pauseMs: 1000,
};

const corsairThrow = {
  move: [
    { row: 7, col: 0 },
    { row: 7, col: 1 },
    { row: 7, col: 2 },
  ],
  intervalMs: 300,
  pause: false,
  pauseMs: 0,
};

const spriteSets = [
  { key: "fire", label: "射擊", value: corsairFire },
  { key: "octopus", label: "章魚", value: corsairOctopus },
  { key: "throw", label: "丟炸彈，鳥蛋", value: corsairThrow },
  { key: "walk", label: "走路", value: walk },
  { key: "stand1", label: "站立", value: stand1 },
  { key: "stand2", label: "站立", value: stand2 },
  { key: "alert", label: "警戒", value: Alert },
];

function ImageResolution() {
  const [info, setInfo] = useState<string>("");
  const [psdData, setPsdData] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const firstGridRef = useRef<HTMLCanvasElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spriteSet, setSpriteSet] = useState(corsairFire);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const psd = readPsd(new Uint8Array(arrayBuffer));
      const width = psd.width;
      const height = psd.height;

      setInfo(`寬度: ${width}px，高度: ${height}px`);
      setPsdData(psd);

      // 調試資訊
      console.log("PSD 數據結構:", psd);
      console.log("PSD 屬性:", Object.keys(psd));
      if (psd.children) {
        console.log("圖層數量:", psd.children.length);
        // 新增：列出每個圖層的名稱和 canvas 屬性
        psd.children.forEach((layer: any, i: number) => {
          console.log(
            `圖層${i} 名稱:${layer.name} canvas:`,
            layer.canvas,
            layer.hidden
          );
        });
      }
      // 新增：把 psd 掛到 window 方便 console debug
      (window as any).psd = psd;
    } catch (error) {
      console.error("讀取 PSD 檔案時發生錯誤:", error);
      setInfo("讀取 PSD 檔案時發生錯誤");
    }
  };

  const renderPsdToCanvas = (psd: any, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 設置 Canvas 尺寸
    canvas.width = psd.width;
    canvas.height = psd.height;

    // 清空 Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    console.log("開始渲染 PSD 到 Canvas");
    console.log("Canvas 尺寸:", canvas.width, "x", canvas.height);

    // 渲染 PSD 的合成圖像
    if (psd.children && psd.children.length > 0) {
      psd.children.forEach((layer: any) => {
        if (layer.canvas && !layer.hidden) {
          // 依照圖層的 left/top 屬性正確定位
          ctx.drawImage(
            layer.canvas,
            0,
            0,
            layer.canvas.width,
            layer.canvas.height, // 圖層原始尺寸
            layer.left || 0,
            layer.top || 0,
            layer.canvas.width,
            layer.canvas.height // 主畫布上的正確位置
          );
        }
      });
    } else if (psd.canvas) {
      console.log("PSD 有直接的 canvas 屬性");
      ctx.drawImage(psd.canvas, 0, 0);
    } else if (psd.image) {
      console.log("PSD 有 image 屬性");
      // 嘗試創建一個 ImageData 來顯示
      try {
        const imageData = ctx.createImageData(psd.width, psd.height);

        // 如果 PSD 有 image 屬性且包含像素數據
        if (psd.image.data) {
          console.log("圖像數據長度:", psd.image.data.length);
          for (let i = 0; i < psd.image.data.length; i += 4) {
            imageData.data[i] = psd.image.data[i]; // R
            imageData.data[i + 1] = psd.image.data[i + 1]; // G
            imageData.data[i + 2] = psd.image.data[i + 2]; // B
            imageData.data[i + 3] = psd.image.data[i + 3]; // A
          }
          ctx.putImageData(imageData, 0, 0);
          console.log("成功渲染圖像數據");
        } else {
          console.log("圖像數據為空");
          // 如果沒有圖像數據，顯示一個佔位符
          ctx.fillStyle = "#f0f0f0";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#666";
          ctx.font = "16px Arial";
          ctx.textAlign = "center";
          ctx.fillText(
            "無法渲染 PSD 圖像",
            canvas.width / 2,
            canvas.height / 2
          );
        }
      } catch (error) {
        console.error("渲染 PSD 時發生錯誤:", error);
        // 顯示錯誤訊息
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#666";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("渲染失敗", canvas.width / 2, canvas.height / 2);
      }
    } else {
      console.log("PSD 沒有可渲染的圖像數據");
      // 顯示佔位符
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#666";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText("無法渲染 PSD 圖像", canvas.width / 2, canvas.height / 2);
    }
  };

  useEffect(() => {
    if (psdData && canvasRef.current && firstGridRef.current) {
      renderPsdToCanvas(psdData, canvasRef.current);

      const srcCanvas = canvasRef.current;
      const destCanvas = firstGridRef.current;
      const destCtx = destCanvas.getContext("2d");
      if (!destCtx) return;

      const gridWidth = 250;
      const gridHeight = 250;
      const { row, col } = spriteSet.move[currentIndex];

      destCanvas.width = gridWidth;
      destCanvas.height = gridHeight;
      destCtx.clearRect(0, 0, gridWidth, gridHeight);

      // 判斷 octopus 就旋轉
      const isOctopus = spriteSet === corsairOctopus;
      let angle = 0;
      if (isOctopus) {
        const N = corsairOctopus.move.length;
        if (N > 1) {
          angle = (currentIndex * 2 * Math.PI) / (N - 1);
        }
        // 讓旋轉軸心在canvas 中央
        destCtx.save();
        destCtx.translate(gridWidth / 2, gridHeight / 2);
        destCtx.rotate(angle);
        destCtx.drawImage(
          srcCanvas,
          col * gridWidth,
          row * gridHeight,
          gridWidth,
          gridHeight,
          -gridWidth / 2,
          -gridHeight / 2,
          gridWidth,
          gridHeight
        );
        destCtx.restore();
      } else {
        // 不旋轉的動作使用的
        destCtx.drawImage(
          srcCanvas,
          col * gridWidth,
          row * gridHeight,
          gridWidth,
          gridHeight,
          0,
          0,
          gridWidth,
          gridHeight
        );
      }
    }
  }, [psdData, currentIndex, spriteSet]);

  useEffect(() => {
    if (spriteSet.move.length <= 1) return;
    let timeout: NodeJS.Timeout;
    const isLast = currentIndex === spriteSet.move.length - 1;
    const delay =
      spriteSet.pause && isLast ? spriteSet.pauseMs : spriteSet.intervalMs;
    timeout = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % spriteSet.move.length);
    }, delay);
    return () => clearTimeout(timeout);
  }, [spriteSet, currentIndex]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">圖片分辨率</h1>
      <div className="relative inline-block mb-4">
        {/* 使用 Shadcn/ui 的 Button 元件 */}
        <Button
          type="button" // 確保是 type="button" 以避免觸發表單提交
          onClick={() => document.getElementById("psdFileInput")?.click()}
        >
          選擇 PSD 檔案
        </Button>

        {/* 隱藏的原生檔案輸入框 */}
        <input
          type="file"
          accept=".psd"
          onChange={handleFileChange}
          className="absolute left-0 top-0 w-full h-full opacity-0 cursor-pointer"
          id="psdFileInput" // 給一個唯一的 ID
        />
      </div>

      <div className="border rounded-lg p-4 min-h-[40px] mb-4">
        {info ? <p>{info}</p> : <p>請上傳 PSD 檔案</p>}
      </div>

      {psdData && (
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">圖片預覽</h2>
          <div className="overflow-auto border rounded">
            <canvas
              ref={canvasRef}
              style={{
                maxWidth: "100%",
                height: "auto",
                display: "block",
              }}
            />
          </div>
        </div>
      )}
      <div>
        <Select
          value={spriteSets.find((s) => s.value === spriteSet)?.key}
          onValueChange={(value) => {
            const selected = spriteSets.find((s) => s.key === value);
            if (selected) {
              setSpriteSet(selected.value);
              setCurrentIndex(0);
            }
          }}
        >
          <SelectTrigger className="w-[180px] mb-4">
            <SelectValue placeholder="選擇動作" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>動作類型</SelectLabel>
              {spriteSets.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <canvas
          ref={firstGridRef}
          style={{
            border: "1px solid #aaa",
            marginTop: "16px",
            width: "250px",
            height: "250px",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}

export default ImageResolution;
