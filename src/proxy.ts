import { NextResponse } from "next/server";

import { auth } from "@/auth";

export default auth((request) => {
	const { nextUrl } = request;
	const path = nextUrl.pathname;
	const isLoggedIn = !!request.auth?.user;

	const isAdmin = path.startsWith("/admin");
	const isAuthPage =
		path.startsWith("/login") ||
		path.startsWith("/forgot-password") ||
		path.startsWith("/update-password");

	if (isAdmin && !isLoggedIn) {
		const url = nextUrl.clone();
		url.pathname = "/login";
		url.searchParams.set("next", path);
		return NextResponse.redirect(url);
	}

	if (isAuthPage && isLoggedIn && !path.startsWith("/update-password")) {
		const url = nextUrl.clone();
		url.pathname = "/admin";
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
});

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
	]
};
