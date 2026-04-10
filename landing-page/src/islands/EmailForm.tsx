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

const TURNSTILE_SITE_KEY = "0x4AAAAAAC2SHdkOwzBfIhrn"; // Cloudflare test key — swap in prod via DEPLOY.md DONE

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
			// Confetti
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
	const inputH = isHero
		? "h-[64px] text-[20px] md:text-[24px]"
		: "h-[56px] text-[18px]";

	if (state === "success") {
		const body = copy.successBody.replace(
			"{email}",
			`<strong class="text-[#F5EBD8]">${email.replace(/[<>&]/g, "")}</strong>`,
		);
		return (
			<div
				role="status"
				aria-live="polite"
				class="w-full max-w-xl rounded-lg border border-[#D97706]/40 bg-[#221B16]/90 p-6 sm:p-7 shadow-[0_0_40px_rgba(217,119,6,0.15)] animate-[fadeIn_300ms_ease-out]"
			>
				<div class="flex items-start gap-4">
					<div class="flex-shrink-0 w-12 h-12 rounded-full bg-[#D97706] flex items-center justify-center">
						<svg
							width="26"
							height="26"
							viewBox="0 0 24 24"
							fill="none"
							role="img"
							aria-label="ok"
						>
							<title>ok</title>
							<path
								d="M4 12.5l5 5L20 6.5"
								stroke="white"
								stroke-width="3"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
					<div class="flex-1 min-w-0">
						<h3 class="text-[22px] sm:text-[26px] font-semibold text-[#F5EBD8] leading-tight">
							{copy.successTitle}
						</h3>
						<p
							class="mt-2 text-[15px] sm:text-[16px] leading-relaxed text-[#E8D9BF] break-words"
							// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized
							dangerouslySetInnerHTML={{ __html: body }}
						/>
						<p class="mt-3 text-[13px] leading-relaxed text-[#B7A089] font-mono tracking-tight">
							⚠ {copy.successSpam}
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<form onSubmit={onSubmit} class="w-full max-w-xl relative" noValidate>
			<div ref={tsRef} aria-hidden="true" />
			<div
				class={`relative flex flex-col sm:flex-row gap-3 sm:gap-0 rounded-md overflow-visible`}
			>
				<input
					type="email"
					required
					placeholder={copy.emailPlaceholder}
					value={email}
					onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
					disabled={state === "loading"}
					class={`min-w-70 ${inputH} px-5 rounded-md sm:rounded-r-none bg-[#221B16] border border-white/10 focus:border-[#D97706] focus:outline-none text-[#F5EBD8] placeholder:text-[#B7A089]/60 font-sans transition-colors`}
				/>
				<button
					type="submit"
					disabled={state === "loading"}
					class={`btn-amber ${inputH} px-6 sm:px-8 rounded-md sm:rounded-l-none font-sans text-[14px] sm:text-[15px] tracking-[-0.005em] sm:whitespace-nowrap text-white font-semibold disabled:opacity-80 flex items-center justify-center gap-2 relative text-center leading-tight`}
				>
					{state === "loading" ? (
						<span class="inline-block w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
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
				<p class="mt-3 font-mono text-[12px] tracking-wider text-[#D97706]">
					✕ {message}
				</p>
			)}
		</form>
	);
};
