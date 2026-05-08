import type React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

export type SlideData = {
	number: number;
	total: number;
	title: string;
	body: string;
	accentColor: string;
	icon?: string;
	footnote?: string;
};

type CarouselSlideProps = {
	carouselTitle: string;
	slide: SlideData;
	variant: "cover" | "content" | "cta";
	theme?: "legal" | "pipeline" | "scoring" | "mystery";
	backgroundImage?: string;
};

const BRAND = {
	bg: "#0F0D0B",
	surface: "#1A1614",
	accent: "#D97706",
	text: "#FFFFFF",
	muted: "#A0836C",
	green: "#4ADE80",
	cyan: "#22D3EE",
	red: "#EF4444",
	amber: "#FBBF24",
};

const THEME_COLORS: Record<string, string> = {
	legal: BRAND.red,
	pipeline: BRAND.cyan,
	scoring: BRAND.green,
	mystery: BRAND.accent,
};

const THEME_TINTS: Record<string, string> = {
	legal: "rgba(239, 68, 68, 0.12)",
	pipeline: "rgba(34, 211, 238, 0.10)",
	scoring: "rgba(74, 222, 128, 0.10)",
	mystery: "rgba(217, 119, 6, 0.12)",
};

const BackgroundLayer: React.FC<{
	image?: string;
	theme: string;
	overlayOpacity?: number;
}> = ({ image, theme, overlayOpacity = 0.78 }) => {
	if (!image) return null;
	return (
		<>
			<Img
				src={staticFile(image)}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					objectFit: "cover",
					transform: "scale(1.08)",
				}}
			/>
			{/* Dark overlay */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					backgroundColor: BRAND.bg,
					opacity: overlayOpacity,
				}}
			/>
			{/* Theme color tint */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					backgroundColor: THEME_TINTS[theme] ?? "transparent",
					mixBlendMode: "screen",
				}}
			/>
			{/* Bottom vignette */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					width: "100%",
					height: "40%",
					background: `linear-gradient(transparent, ${BRAND.bg})`,
				}}
			/>
		</>
	);
};

const DotIndicator: React.FC<{
	current: number;
	total: number;
	color: string;
}> = ({ current, total, color }) => (
	<div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
		{Array.from({ length: total }, (_, i) => {
			const position = i + 1;
			return (
				<div
					key={`dot-${position}`}
					style={{
						width: position === current ? 24 : 8,
						height: 8,
						borderRadius: 4,
						backgroundColor:
							position === current ? color : "rgba(255,255,255,0.2)",
					}}
				/>
			);
		})}
	</div>
);

const CoverSlide: React.FC<{
	title: string;
	subtitle: string;
	themeColor: string;
	total: number;
	bgImage?: string;
	theme: string;
}> = ({ title, subtitle, themeColor, total, bgImage, theme }) => (
	<AbsoluteFill
		style={{
			backgroundColor: BRAND.bg,
			display: "flex",
			flexDirection: "column",
			justifyContent: "center",
			alignItems: "center",
			padding: "80px 60px",
		}}
	>
		<BackgroundLayer image={bgImage} theme={theme} overlayOpacity={0.72} />
		<div
			style={{
				width: 6,
				height: 120,
				backgroundColor: themeColor,
				borderRadius: 3,
				marginBottom: 48,
				zIndex: 1,
			}}
		/>
		<h1
			style={{
				fontFamily: "Inter",
				fontWeight: 900,
				fontSize: 72,
				color: BRAND.text,
				textAlign: "center",
				letterSpacing: -2,
				lineHeight: 1.1,
				margin: 0,
				marginBottom: 32,
				zIndex: 1,
				textShadow: "0 4px 24px rgba(0,0,0,0.6)",
			}}
		>
			{title}
		</h1>
		<p
			style={{
				fontFamily: "Inter",
				fontWeight: 400,
				fontSize: 36,
				color: BRAND.muted,
				textAlign: "center",
				margin: 0,
				marginBottom: 64,
				maxWidth: 800,
				zIndex: 1,
				textShadow: "0 2px 12px rgba(0,0,0,0.5)",
			}}
		>
			{subtitle}
		</p>
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: 16,
				zIndex: 1,
			}}
		>
			<Img
				src={staticFile("images/app-logo.png")}
				style={{ width: 48, height: 48, borderRadius: 12 }}
			/>
			<span
				style={{
					fontFamily: "JetBrains Mono",
					fontSize: 28,
					color: BRAND.muted,
					textShadow: "0 2px 8px rgba(0,0,0,0.5)",
				}}
			>
				wildspotter.app
			</span>
		</div>
		<div style={{ position: "absolute", bottom: 80, zIndex: 1 }}>
			<DotIndicator current={1} total={total} color={themeColor} />
		</div>
		<p
			style={{
				position: "absolute",
				bottom: 40,
				fontFamily: "Inter",
				fontSize: 24,
				color: "rgba(255,255,255,0.3)",
				zIndex: 1,
			}}
		>
			Desliza →
		</p>
	</AbsoluteFill>
);

const ContentSlide: React.FC<{
	slide: SlideData;
	themeColor: string;
	bgImage?: string;
	theme: string;
}> = ({ slide, themeColor, bgImage, theme }) => (
	<AbsoluteFill
		style={{
			backgroundColor: BRAND.bg,
			display: "flex",
			flexDirection: "column",
			padding: "100px 72px 120px",
		}}
	>
		<BackgroundLayer image={bgImage} theme={theme} overlayOpacity={0.82} />
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: 20,
				marginBottom: 48,
				zIndex: 1,
			}}
		>
			<div
				style={{
					width: 64,
					height: 64,
					borderRadius: 16,
					backgroundColor: themeColor,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					fontFamily: "JetBrains Mono",
					fontWeight: 700,
					fontSize: 28,
					color: BRAND.bg,
					flexShrink: 0,
				}}
			>
				{slide.icon ?? `0${slide.number}`}
			</div>
			<div
				style={{
					height: 4,
					flex: 1,
					backgroundColor: "rgba(255,255,255,0.06)",
					borderRadius: 2,
				}}
			>
				<div
					style={{
						height: "100%",
						width: `${(slide.number / slide.total) * 100}%`,
						backgroundColor: themeColor,
						borderRadius: 2,
						opacity: 0.4,
					}}
				/>
			</div>
		</div>

		<h2
			style={{
				fontFamily: "Inter",
				fontWeight: 800,
				fontSize: 56,
				color: BRAND.text,
				letterSpacing: -1.5,
				lineHeight: 1.15,
				margin: 0,
				marginBottom: 40,
				zIndex: 1,
				textShadow: "0 4px 20px rgba(0,0,0,0.5)",
			}}
		>
			{slide.title}
		</h2>

		<div
			style={{
				width: 48,
				height: 4,
				backgroundColor: themeColor,
				borderRadius: 2,
				marginBottom: 40,
				zIndex: 1,
			}}
		/>

		<p
			style={{
				fontFamily: "Inter",
				fontWeight: 400,
				fontSize: 38,
				color: BRAND.muted,
				lineHeight: 1.5,
				margin: 0,
				flex: 1,
				zIndex: 1,
				textShadow: "0 2px 12px rgba(0,0,0,0.4)",
			}}
		>
			{slide.body}
		</p>

		{slide.footnote && (
			<p
				style={{
					fontFamily: "JetBrains Mono",
					fontSize: 22,
					color: "rgba(255,255,255,0.25)",
					margin: 0,
					marginTop: 24,
					zIndex: 1,
				}}
			>
				{slide.footnote}
			</p>
		)}

		<div
			style={{
				position: "absolute",
				bottom: 60,
				left: 0,
				right: 0,
				display: "flex",
				justifyContent: "center",
				zIndex: 1,
			}}
		>
			<DotIndicator
				current={slide.number}
				total={slide.total}
				color={themeColor}
			/>
		</div>
	</AbsoluteFill>
);

const CtaSlide: React.FC<{
	total: number;
	themeColor: string;
	bgImage?: string;
	theme: string;
}> = ({ total, themeColor, bgImage, theme }) => (
	<AbsoluteFill
		style={{
			backgroundColor: BRAND.bg,
			display: "flex",
			flexDirection: "column",
			justifyContent: "center",
			alignItems: "center",
			padding: "80px 60px",
		}}
	>
		<BackgroundLayer image={bgImage} theme={theme} overlayOpacity={0.75} />
		<Img
			src={staticFile("images/app-logo.png")}
			style={{
				width: 120,
				height: 120,
				borderRadius: 28,
				marginBottom: 48,
				zIndex: 1,
			}}
		/>
		<h2
			style={{
				fontFamily: "Inter",
				fontWeight: 900,
				fontSize: 56,
				color: BRAND.text,
				textAlign: "center",
				letterSpacing: -1.5,
				margin: 0,
				marginBottom: 24,
				zIndex: 1,
				textShadow: "0 4px 24px rgba(0,0,0,0.6)",
			}}
		>
			Compruébalo antes de aparcar.
		</h2>
		<p
			style={{
				fontFamily: "Inter",
				fontWeight: 400,
				fontSize: 36,
				color: BRAND.muted,
				textAlign: "center",
				margin: 0,
				marginBottom: 48,
				zIndex: 1,
				textShadow: "0 2px 12px rgba(0,0,0,0.5)",
			}}
		>
			Gratis en App Store.
		</p>
		<div
			style={{
				padding: "20px 48px",
				borderRadius: 16,
				backgroundColor: themeColor,
				fontFamily: "Inter",
				fontWeight: 700,
				fontSize: 32,
				color: BRAND.bg,
				zIndex: 1,
			}}
		>
			wildspotter.app
		</div>
		<div
			style={{
				position: "absolute",
				bottom: 60,
				left: 0,
				right: 0,
				display: "flex",
				justifyContent: "center",
				zIndex: 1,
			}}
		>
			<DotIndicator current={total} total={total} color={themeColor} />
		</div>
	</AbsoluteFill>
);

export const CarouselSlide: React.FC<CarouselSlideProps> = ({
	carouselTitle,
	slide,
	variant,
	theme = "mystery",
	backgroundImage,
}) => {
	const themeColor = THEME_COLORS[theme] ?? BRAND.accent;

	if (variant === "cover") {
		return (
			<CoverSlide
				title={carouselTitle}
				subtitle={slide.body}
				themeColor={themeColor}
				total={slide.total}
				bgImage={backgroundImage}
				theme={theme}
			/>
		);
	}

	if (variant === "cta") {
		return (
			<CtaSlide
				total={slide.total}
				themeColor={themeColor}
				bgImage={backgroundImage}
				theme={theme}
			/>
		);
	}

	return (
		<ContentSlide
			slide={slide}
			themeColor={themeColor}
			bgImage={backgroundImage}
			theme={theme}
		/>
	);
};
