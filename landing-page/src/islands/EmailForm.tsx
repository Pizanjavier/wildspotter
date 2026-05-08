import { useEffect, useRef, useState } from "preact/hooks";

declare global {
	interface Window {
		turnstile?: {
			render: (
				el: HTMLElement,
				opts: {
					sitekey: string;
					size?: "invisible" | "normal";
					callback?: (token: string) => void;
				},
			) => string;
			execute: (widgetId: string) => void;
			reset: (widgetId?: string) => void;
			getResponse: (widgetId?: string) => string | undefined;
		};
	}
}

const TURNSTILE_SITE_KEY = "0x4AAAAAAC2SHdkOwzBfIhrn";

type Copy = {
	emailPlaceholder: string;
	cta: string;
	thanks: string;
	successTitle: string;
	successBody: string;
	successSpam: string;
	errorGeneric: string;
	errorEmail: string;
	errorDup: string;
};

interface Props {
	copy: Copy;
	locale: "es" | "en";
	variant?: "hero" | "footer";
}

type State = "idle" | "loading" | "success" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EmailForm = ({ copy, locale, variant = "hero" }: Props) => {
	const [email, setEmail] = useState("");
	const [state, setState] = useState<State>("idle");
	const [message, setMessage] = useState("");
	const [confetti, setConfetti] = useState<
		Array<{ id: number; cx: string; cy: string }>
	>([]);
	const tsRef = useRef<HTMLDivElement>(null);
	const widgetId = useRef<string | null>(null);
	const tokenRef = useRef<string>("");
	const tokenResolvers = useRef<Array<(t: string) => void>>([]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const ensureScript = () =>
			new Promise<void>((resolve) => {
				if (window.turnstile) return resolve();
				const existing = document.querySelector<HTMLScriptElement>(
					"script[data-turnstile]",
				);
				if (existing) {
					existing.addEventListener("load", () => resolve(), { once: true });
					return;
				}
				const s = document.createElement("script");
				s.src =
					"https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
				s.async = true;
				s.defer = true;
				s.dataset.turnstile = "1";
				s.addEventListener("load", () => resolve(), { once: true });
				document.head.appendChild(s);
			});
		ensureScript().then(() => {
			if (!tsRef.current || !window.turnstile || widgetId.current) return;
			widgetId.current = window.turnstile.render(tsRef.current, {
				sitekey: TURNSTILE_SITE_KEY,
				callback: (t: string) => {
					tokenRef.current = t;
					const q = tokenResolvers.current;
					tokenResolvers.current = [];
					for (const r of q) r(t);
				},
			});
		});
	}, []);

	const getTurnstileToken = async (): Promise<string> => {
		if (tokenRef.current) return tokenRef.current;
		if (typeof window === "undefined" || !window.turnstile) return "";
		return new Promise((resolve) => {
			tokenResolvers.current.push(resolve);
			setTimeout(() => {
				const i = tokenResolvers.current.indexOf(resolve);
				if (i >= 0) {
					tokenResolvers.current.splice(i, 1);
					resolve("");
				}
			}, 8000);
		});
	};

	const onSubmit = async (e: Event) => {
		e.preventDefault();
		if (!EMAIL_RE.test(email)) {
			setState("error");
			setMessage(copy.errorEmail);
			return;
		}
		setState("loading");
		setMessage("");
		try {
			const qs =
				typeof window !== "undefined"
					? new URLSearchParams(window.location.search)
					: new URLSearchParams();
			const turnstile_token = await getTurnstileToken();
			const res = await fetch("/api/subscribe", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email,
					locale,
					referrer: typeof document !== "undefined" ? document.referrer : "",
					utm_source: qs.get("utm_source") ?? "",
					utm_medium: qs.get("utm_medium") ?? "",
					utm_campaign: qs.get("utm_campaign") ?? "",
					turnstile_token,
				}),
			});
			const data = (await res.json().catch(() => ({}))) as {
				ok?: boolean;
				error?: string;
			};
			if (!res.ok || !data.ok) {
				setState("error");
				setMessage(
					data.error === "duplicate" ? copy.errorDup : copy.errorGeneric,
				);
				return;
			}
			setState("success");
			setMessage(copy.thanks);
			const dots = Array.from({ length: 14 }, (_, i) => ({
				id: i,
				cx: `${(Math.random() * 2 - 1) * 140}px`,
				cy: `${-80 - Math.random() * 120}px`,
			}));
			setConfetti(dots);
			setTimeout(() => setConfetti([]), 1000);
		} catch {
			setState("error");
			setMessage(copy.errorGeneric);
		}
	};

	const isHero = variant === "hero";
	const h = isHero ? 64 : 56;

	if (state === "success") {
		const body = copy.successBody.replace(
			"{email}",
			`<strong style="color:#1F1A12">${email.replace(/[<>&]/g, "")}</strong>`,
		);
		return (
			<div
				role="status"
				aria-live="polite"
				style={{
					width: "100%",
					maxWidth: "580px",
					borderRadius: "12px",
					border: "1px solid rgba(224,122,31,0.4)",
					backgroundColor: "white",
					padding: "24px",
					boxShadow: "0 8px 30px rgba(60,40,15,0.10)",
					animation: "fadeIn 300ms ease-out",
				}}
			>
				<div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
					<div
						style={{
							flexShrink: 0,
							width: "48px",
							height: "48px",
							borderRadius: "50%",
							backgroundColor: "#E07A1F",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<svg width="26" height="26" viewBox="0 0 24 24" fill="none" role="img" aria-label="ok">
							<title>ok</title>
							<path d="M4 12.5l5 5L20 6.5" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</div>
					<div style={{ flex: 1, minWidth: 0 }}>
						<h3 style={{ fontSize: "22px", fontWeight: 600, color: "#1F1A12", lineHeight: 1.15 }}>
							{copy.successTitle}
						</h3>
						<p
							style={{ marginTop: "8px", fontSize: "15px", lineHeight: 1.55, color: "#4A4233", wordBreak: "break-word" }}
							// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized
							dangerouslySetInnerHTML={{ __html: body }}
						/>
						<p style={{ marginTop: "12px", fontSize: "13px", lineHeight: 1.55, color: "#786E59", fontFamily: "var(--mono)", letterSpacing: "-0.01em" }}>
							⚠ {copy.successSpam}
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<form onSubmit={onSubmit} style={{ width: "100%", maxWidth: "580px", position: "relative" }} noValidate>
			<div ref={tsRef} aria-hidden="true" />
			<div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "12px" }}>
				<input
					type="email"
					required
					placeholder={copy.emailPlaceholder}
					value={email}
					onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
					disabled={state === "loading"}
					style={{
						height: `${h}px`,
						padding: "0 20px",
						borderRadius: "8px",
						backgroundColor: "white",
						border: "1px solid #DFD6BF",
						color: "#1F1A12",
						fontSize: isHero ? "20px" : "18px",
						fontFamily: "var(--sans)",
						outline: "none",
						width: "100%",
						boxSizing: "border-box",
					}}
				/>
				<button
					type="submit"
					disabled={state === "loading"}
					style={{
						height: `${h}px`,
						padding: "0 24px",
						borderRadius: "8px",
						backgroundColor: "#E07A1F",
						color: "white",
						fontSize: "15px",
						fontFamily: "var(--sans)",
						fontWeight: 600,
						border: "none",
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: "8px",
						whiteSpace: "nowrap",
						opacity: state === "loading" ? 0.8 : 1,
						transition: "background-color 0.2s",
					}}
					onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#C56612"; }}
					onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E07A1F"; }}
				>
					{state === "loading" ? (
						<span
							style={{
								display: "inline-block",
								width: "20px",
								height: "20px",
								border: "2px solid rgba(255,255,255,0.4)",
								borderTopColor: "white",
								borderRadius: "50%",
								animation: "spin 1s linear infinite",
							}}
						/>
					) : (
						<span>{copy.cta}</span>
					)}
				</button>
				{confetti.map((c) => (
					<span
						key={c.id}
						class="confetti-dot"
						style={{
							left: "75%",
							top: "50%",
							["--cx" as unknown as string]: c.cx,
							["--cy" as unknown as string]: c.cy,
						}}
					/>
				))}
			</div>
			{message && (
				<p style={{ marginTop: "12px", fontFamily: "var(--mono)", fontSize: "12px", letterSpacing: "0.04em", color: "#C9412C" }}>
					✕ {message}
				</p>
			)}
		</form>
	);
};
