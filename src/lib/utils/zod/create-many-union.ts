import { type Primitive, type RawCreateParams, z, type ZodLiteral } from "zod";

type MappedZodLiterals<T extends readonly Primitive[]> = {
  -readonly [K in keyof T]: ZodLiteral<T[K]>;
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createManyUnion<A extends Readonly<[Primitive, Primitive, ...Primitive[]]>>(
  literals: A,
  params?: RawCreateParams
) {
  return z.union(literals.map((value) => z.literal(value)) as MappedZodLiterals<A>, params);
}
