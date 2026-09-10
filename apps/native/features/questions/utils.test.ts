import { describe, expect, it } from "vitest";
import {
  deriveCorrectAnswer,
  formatCorrectAnswerText,
  gradeAnswerLocally,
  parsePromptSegments,
  resolveTrueFalseOptions,
  sortFillBlankOptions,
} from "./utils";
import type { Question, QuestionOption } from "./types";

const opt = (
  id: number,
  label: string | null,
  content: string,
  isCorrect = false,
): QuestionOption => ({ id, label, content, isCorrect });

const question = (partial: Partial<Question>): Question =>
  ({
    id: 1,
    prompt: "",
    type: "multiple_choice",
    difficulty: "basic",
    status: "active",
    createdAt: "",
    updatedAt: "",
    ...partial,
  }) as Question;

describe("resolveTrueFalseOptions", () => {
  it("prefers the label the admin editor writes", () => {
    const { trueOption, falseOption } = resolveTrueFalseOptions([
      opt(1, "Falso", "Falso"),
      opt(2, "Verdadeiro", "Verdadeiro", true),
    ]);
    expect(trueOption?.id).toBe(2);
    expect(falseOption?.id).toBe(1);
  });

  it("falls back to content for rows labelled A/B, as the seeds are", () => {
    const { trueOption, falseOption } = resolveTrueFalseOptions([
      opt(9, "A", "Verdadeiro", true),
      opt(10, "B", "Falso"),
    ]);
    expect(trueOption?.content).toBe("Verdadeiro");
    expect(falseOption?.content).toBe("Falso");
  });

  it("never returns the same option twice", () => {
    // Both contents match the "true" keywords; the pair must still be distinct.
    const { trueOption, falseOption } = resolveTrueFalseOptions([
      opt(1, null, "Sim, é verdadeiro", true),
      opt(2, null, "Também verdadeiro"),
    ]);
    expect(trueOption).toBeTruthy();
    expect(falseOption).toBeTruthy();
    expect(trueOption?.id).not.toBe(falseOption?.id);
  });

  it("returns nulls for an empty option list", () => {
    expect(resolveTrueFalseOptions([])).toEqual({
      trueOption: null,
      falseOption: null,
    });
  });
});

describe("sortFillBlankOptions", () => {
  it("orders by id, since the table has no sequence column", () => {
    const sorted = sortFillBlankOptions([
      { id: 3, blankId: 1, text: "c", isCorrect: false },
      { id: 1, blankId: 1, text: "a", isCorrect: true },
      { id: 2, blankId: 1, text: "b", isCorrect: false },
    ]);
    expect(sorted.map((o) => o.text)).toEqual(["a", "b", "c"]);
  });
});

describe("deriveCorrectAnswer", () => {
  it("returns correct option ids for choice questions", () => {
    expect(
      deriveCorrectAnswer(
        question({
          type: "multiple_choice",
          options: [opt(1, "A", "Aorta", true), opt(2, "B", "Veia Cava")],
        }),
      ),
    ).toEqual([1]);
  });

  it("falls back to a blank's canonical answer when it has no options", () => {
    expect(
      deriveCorrectAnswer(
        question({
          type: "fill_in_the_blank",
          fillInBlanks: [
            { id: 1, sequence: 1, placeholder: null, answer: "coração" },
          ],
        }),
      ),
    ).toEqual({ "1": "coração" });
  });

  it("prefers a blank's correct option over its stored answer", () => {
    expect(
      deriveCorrectAnswer(
        question({
          type: "fill_in_the_blank",
          fillInBlanks: [
            {
              id: 1,
              sequence: 1,
              placeholder: null,
              answer: "stale",
              options: [
                { id: 1, blankId: 1, text: "coração", isCorrect: true },
                { id: 2, blankId: 1, text: "fígado", isCorrect: false },
              ],
            },
          ],
        }),
      ),
    ).toEqual({ "1": "coração" });
  });

  it("keys matching pairs by left text, as the server does", () => {
    expect(
      deriveCorrectAnswer(
        question({
          type: "matching",
          matchingPairs: [
            { id: 5, leftText: "Coração", rightText: "Bombear", sequence: 1 },
          ],
        }),
      ),
    ).toEqual({ Coração: "Bombear" });
  });
});

describe("gradeAnswerLocally", () => {
  const fillBlank = question({
    type: "fill_in_the_blank",
    fillInBlanks: [
      { id: 1, sequence: 1, placeholder: null, answer: "coração" },
    ],
  });

  it("accepts a correctly typed free-text blank", () => {
    // Regression: the quiz previously required a correct *option* on every
    // blank and marked answer-only blanks wrong no matter what was typed.
    expect(gradeAnswerLocally(fillBlank, { "1": "coração" })).toBe(true);
  });

  it("is case and whitespace insensitive, like the server", () => {
    expect(gradeAnswerLocally(fillBlank, { "1": "  Coração " })).toBe(true);
  });

  it("rejects a wrong free-text blank", () => {
    expect(gradeAnswerLocally(fillBlank, { "1": "fígado" })).toBe(false);
  });

  it("grades single-select choice questions", () => {
    const mc = question({
      type: "multiple_choice",
      options: [opt(1, "A", "Aorta", true), opt(2, "B", "Veia Cava")],
    });
    expect(gradeAnswerLocally(mc, 1)).toBe(true);
    expect(gradeAnswerLocally(mc, 2)).toBe(false);
  });

  it("requires every matching pair to line up", () => {
    const matching = question({
      type: "matching",
      matchingPairs: [
        { id: 1, leftText: "Coração", rightText: "Bombear", sequence: 1 },
        { id: 2, leftText: "Pulmão", rightText: "Trocas", sequence: 2 },
      ],
    });
    expect(
      gradeAnswerLocally(matching, { Coração: "Bombear", Pulmão: "Trocas" }),
    ).toBe(true);
    expect(
      gradeAnswerLocally(matching, { Coração: "Trocas", Pulmão: "Bombear" }),
    ).toBe(false);
  });

  it("returns false rather than throwing on missing data", () => {
    expect(gradeAnswerLocally(null, 1)).toBe(false);
    expect(gradeAnswerLocally(question({ type: "matching" }), {})).toBe(false);
  });
});

describe("formatCorrectAnswerText", () => {
  it("resolves option ids to their content", () => {
    const q = question({
      options: [opt(1, "A", "Aorta", true), opt(2, "B", "Veia Cava")],
    });
    expect(formatCorrectAnswerText([1], q)).toBe("Aorta");
  });

  it("renders matching pairs as arrows", () => {
    const q = question({
      type: "matching",
      matchingPairs: [
        { id: 1, leftText: "Coração", rightText: "Bombear", sequence: 1 },
      ],
    });
    expect(formatCorrectAnswerText({ Coração: "Bombear" }, q)).toBe(
      "Coração → Bombear",
    );
  });

  it("does not throw when the answer is absent", () => {
    expect(formatCorrectAnswerText(undefined, undefined)).toBe(
      "Resposta não disponível",
    );
  });
});

describe("parsePromptSegments", () => {
  it("interleaves text and blanks, stripping block tags", () => {
    const segments = parsePromptSegments(
      "<p>O sistema é composto pelo {{1}} e pelos {{2}} sanguíneos.</p>",
    );
    expect(segments.map((s) => s.type)).toEqual([
      "text",
      "blank",
      "text",
      "blank",
      "text",
    ]);
    expect(segments.filter((s) => s.type === "blank")).toEqual([
      { type: "blank", blankIndex: 0 },
      { type: "blank", blankIndex: 1 },
    ]);
  });

  it("preserves the emphasis the tag stripper used to discard", () => {
    const segments = parsePromptSegments("plain <strong>bold</strong>");
    expect(segments).toEqual([
      {
        type: "text",
        text: "plain ",
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
      },
      {
        type: "text",
        text: "bold",
        bold: true,
        italic: false,
        underline: false,
        strikethrough: false,
      },
    ]);
  });

  it("decodes entities", () => {
    const [segment] = parsePromptSegments("a &amp; b &nbsp;c");
    expect(segment).toMatchObject({ type: "text", text: "a & b c" });
  });

  it("drops script content entirely", () => {
    const segments = parsePromptSegments("safe<script>alert(1)</script>");
    expect(segments.map((s) => (s.type === "text" ? s.text : s.type))).toEqual([
      "safe",
    ]);
  });

  it("yields no blanks when the prompt has no markers", () => {
    const segments = parsePromptSegments("<p>Nada aqui.</p>");
    expect(segments.some((s) => s.type === "blank")).toBe(false);
  });

  it("returns nothing for an absent prompt", () => {
    expect(parsePromptSegments(undefined)).toEqual([]);
  });
});
