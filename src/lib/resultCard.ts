export interface ResultCardInput {
  resultType: string;
  topTraits: readonly [string, string];
  summary: string;
  imageUrl: string;
}

const CARD_WIDTH = 900;
const CARD_HEIGHT = 1200;

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (context.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;

    if (lines.length === maxLines) {
      break;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  const sourceWasTruncated = lines.join(" ").length < text.trim().length;

  if (sourceWasTruncated && lines.length > 0) {
    let lastLine = lines[lines.length - 1];

    while (
      lastLine.length > 1 &&
      context.measureText(`${lastLine}…`).width > maxWidth
    ) {
      lastLine = lastLine.slice(0, -1);
    }

    lines[lines.length - 1] = `${lastLine}…`;
  }

  return lines;
}

async function loadCardImage(imageUrl: string) {
  const image = new Image();
  image.decoding = "async";

  const loaded = new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("결과 이미지를 불러오지 못했습니다."));
  });

  image.src = imageUrl;
  return loaded;
}

function canvasToPng(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("결과 카드 이미지를 만들지 못했습니다."));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

export async function createResultCardPng({
  resultType,
  topTraits,
  summary,
  imageUrl,
}: ResultCardInput) {
  await document.fonts.ready;

  const sourceImage = await loadCardImage(imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("결과 카드 생성 기능을 사용할 수 없습니다.");
  }

  const background = context.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  background.addColorStop(0, "#d5dfe5");
  background.addColorStop(1, "#cbd8e0");
  context.fillStyle = background;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  drawRoundedRect(context, 34, 34, 832, 1132, 6);
  context.fillStyle = "rgba(225, 233, 237, 0.38)";
  context.fill();
  context.strokeStyle = "rgba(51, 45, 39, 0.76)";
  context.lineWidth = 2;
  context.stroke();

  const contentX = 82;
  const contentWidth = 736;
  const fontFamily = '"Apple SD Gothic Neo", "Noto Sans KR", Arial, sans-serif';

  context.fillStyle = "#332d27";
  context.font = `500 56px ${fontFamily}`;
  const titleLines = wrapText(context, resultType, contentWidth, 2);
  const titleStartY = 124;
  const titleLineHeight = 66;

  titleLines.forEach((line, index) => {
    context.fillText(line, contentX, titleStartY + index * titleLineHeight);
  });

  const traitsY = titleStartY + (titleLines.length - 1) * titleLineHeight + 34;
  const pillWidth = 348;
  const pillHeight = 52;

  topTraits.forEach((trait, index) => {
    const pillX = contentX + index * (pillWidth + 20);
    drawRoundedRect(context, pillX, traitsY, pillWidth, pillHeight, 3);
    context.fillStyle = index === 0 ? "#332d27" : "rgba(255, 255, 255, 0.13)";
    context.fill();
    context.strokeStyle = "rgba(51, 45, 39, 0.6)";
    context.lineWidth = 1;
    context.stroke();

    context.fillStyle = index === 0 ? "#dbe4e8" : "#332d27";
    context.font = `600 22px ${fontFamily}`;
    context.fillText(`TOP ${index + 1}  ${trait}`, pillX + 22, traitsY + 34);
  });

  context.fillStyle = "rgba(51, 45, 39, 0.78)";
  context.font = `500 23px ${fontFamily}`;
  const oneLineDescription =
    summary.trim().match(/^.*?[.!?](?:\s|$)/u)?.[0]?.trim() ?? summary.trim();
  const summaryLines = wrapText(context, oneLineDescription, contentWidth, 2);
  const summaryStartY = traitsY + pillHeight + 44;
  const summaryLineHeight = 35;

  summaryLines.forEach((line, index) => {
    context.fillText(line, contentX, summaryStartY + index * summaryLineHeight);
  });

  const imageY = summaryStartY + summaryLines.length * summaryLineHeight + 24;
  const footerTop = 1098;
  const imageSize = Math.min(contentWidth, footerTop - imageY - 28);
  const imageX = (CARD_WIDTH - imageSize) / 2;

  drawRoundedRect(context, imageX, imageY, imageSize, imageSize, 3);
  context.save();
  context.clip();
  context.drawImage(sourceImage, imageX, imageY, imageSize, imageSize);
  context.restore();
  context.strokeStyle = "rgba(51, 45, 39, 0.6)";
  context.lineWidth = 2;
  context.stroke();

  context.fillStyle = "rgba(51, 45, 39, 0.58)";
  context.font = `600 16px ${fontFamily}`;
  context.letterSpacing = "3px";
  context.textAlign = "center";
  context.fillText("ABSTRACT PERCEPTION TEST", CARD_WIDTH / 2, 1136);

  return canvasToPng(canvas);
}
