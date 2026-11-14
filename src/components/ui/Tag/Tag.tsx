import { cn } from "@/utils";

import { tagVariants } from "./variants";

import type { FC, HTMLAttributes } from "react";
import type { VariantProps } from "class-variance-authority";

type TagProps = HTMLAttributes<HTMLSpanElement> &
	VariantProps<typeof tagVariants>;

const Tag: FC<TagProps> = (props) => {
	const { className, variant, color, ...restProps } = props;

	return (
		<span
			className={cn(tagVariants({ variant, color }), className)}
			{...restProps}
		/>
	);
};

export { Tag, tagVariants };
export type { TagProps };
