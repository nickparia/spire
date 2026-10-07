/**
 * The story, told in chapters: a prologue before the first game, then one
 * chapter after each world is relit. Each page is a paragraph and a painting
 * (public/art/story/<art>.mp4, with a .jpg still). STORY.md is the bible.
 */
export type Page = { text: string; art: string };
export type Chapter = {
  id: string;
  /** The world whose relighting opens it; none for the prologue. */
  world?: string;
  title: string;
  pages: Page[];
};

export const CHAPTERS: Chapter[] = [
  {
    id: "prologue",
    title: "Prologue",
    pages: [
      {
        text: "The skies did not go out all at once. They went out the way lamps do, one by one.",
        art: "p1",
      },
      {
        text: "You are the last builder of the Spire, the tower that held the skies up.",
        art: "p2",
      },
      { text: "You rebuild it from rhythm: the groove, the drop, the set.", art: "p3" },
      { text: "The Dark below is not evil. It eats what falls.", art: "p4" },
    ],
  },
  {
    id: "hearth",
    world: "hearth",
    title: "I · What the Foundry Remembered",
    pages: [
      {
        text: "The fires of Hearth were never for iron. They were for stone that could hold light, cut in the shape the sky would need.",
        art: "c1",
      },
      {
        text: "The builders raised the Spire floor by floor, and each sky they reached, they lit. For an age, the night had stars.",
        art: "c2",
      },
      {
        text: "Then the skies began to go out, one by one, and the builders went quiet. They did not fall. They simply stopped.",
        art: "c3",
      },
      {
        text: "What put the skies out was waiting above them. And now it has seen you.",
        art: "c4",
      },
    ],
  },
];

export function chapterFor(world: string): Chapter | undefined {
  return CHAPTERS.find((c) => c.world === world);
}
