import type { LabelAttributes } from "./Label";

/**
 * Mescla `label.required` com o atributo HTML `required` do controle.
 * Convenção: campo obrigatório → asterisco vermelho na label.
 */
export const resolveLabelAttributes = (
	label: LabelAttributes | undefined,
	nativeRequired?: boolean
): LabelAttributes | undefined => {
	if (label == null) {
		return undefined;
	}

	if (typeof label === "string") {
		return nativeRequired ? { text: label, required: true } : label;
	}

	if (label.required === true) {
		return label;
	}

	if (nativeRequired) {
		return { ...label, required: true };
	}

	return label;
};
