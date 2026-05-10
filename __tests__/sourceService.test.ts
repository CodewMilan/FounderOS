import { describe, it, expect, beforeEach } from "vitest"
import { sourceService } from "@/lib/services/sourceService"
import { store } from "@/lib/store"
import { seedSources } from "@/lib/seed"

beforeEach(() => {
  store._reset()
})

describe("sourceService.list", () => {
  it("returns seeded sources by default", () => {
    const sources = sourceService.list()
    expect(sources.length).toBe(seedSources.length)
  })

  it("returns an array", () => {
    expect(Array.isArray(sourceService.list())).toBe(true)
  })
})

describe("sourceService.get", () => {
  it("returns a source that exists", () => {
    const existing = seedSources[0]
    const found = sourceService.get(existing.id)
    expect(found).toBeDefined()
    expect(found?.id).toBe(existing.id)
  })

  it("returns undefined for an unknown id", () => {
    expect(sourceService.get("not-a-real-id")).toBeUndefined()
  })
})

describe("sourceService.create", () => {
  const validInput = {
    type: "url" as const,
    label: "Test Pricing Page",
    url: "https://example.com/pricing",
    tags: ["pricing"],
    module: "competitors" as const,
  }

  it("creates a source with a generated id", () => {
    const source = sourceService.create(validInput)
    expect(source.id).toMatch(/^src-/)
    expect(source.label).toBe(validInput.label)
    expect(source.url).toBe(validInput.url)
    expect(source.module).toBe(validInput.module)
    expect(source.type).toBe(validInput.type)
    expect(source.tags).toEqual(validInput.tags)
  })

  it("sets createdAt and updatedAt as ISO strings", () => {
    const source = sourceService.create(validInput)
    expect(() => new Date(source.createdAt)).not.toThrow()
    expect(() => new Date(source.updatedAt)).not.toThrow()
  })

  it("persists the source so it appears in list()", () => {
    const before = sourceService.list().length
    sourceService.create(validInput)
    expect(sourceService.list().length).toBe(before + 1)
  })

  it("allows retrieving the new source by id", () => {
    const source = sourceService.create(validInput)
    expect(sourceService.get(source.id)).toEqual(source)
  })

  it("creates multiple distinct sources", () => {
    const a = sourceService.create({ ...validInput, label: "A" })
    const b = sourceService.create({ ...validInput, label: "B" })
    expect(a.id).not.toBe(b.id)
  })

  it("defaults tags to empty array when not provided", () => {
    const { tags, ...rest } = validInput
    const source = sourceService.create(rest)
    expect(source.tags).toEqual([])
  })

  it("throws on empty label", () => {
    expect(() =>
      sourceService.create({ ...validInput, label: "" })
    ).toThrow()
  })

  it("throws on invalid URL", () => {
    expect(() =>
      sourceService.create({ ...validInput, url: "not-a-url" })
    ).toThrow()
  })

  it("throws on unknown module", () => {
    expect(() =>
      sourceService.create({ ...validInput, module: "unknown" as "competitors" })
    ).toThrow()
  })
})

describe("sourceService.delete", () => {
  it("removes an existing source and returns true", () => {
    const source = sourceService.create({
      type: "url",
      label: "To delete",
      url: "https://delete.me",
      module: "prospects",
    })
    expect(sourceService.delete(source.id)).toBe(true)
    expect(sourceService.get(source.id)).toBeUndefined()
  })

  it("returns false for a non-existent id", () => {
    expect(sourceService.delete("ghost-id")).toBe(false)
  })
})
