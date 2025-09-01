1. Primary language: Java 17; build with Maven.
2. Workflow: Strict TDD (Red-Green-Refactor). Always propose and write failing JUnit 5 tests first, then minimal implementation, then refactor while keeping tests green.
3. Testing: Use JUnit 5, Mockito for mocks/stubs, AssertJ optional. Include edge cases (nulls, empty, boundaries, exceptions).
4. Project layout: src/main/java and src/test/java; test naming ClassNameTest or ClassNameShould.
5. Output rules: Show tests first, then implementation. Use separate code blocks per class with the correct language tag. Include all imports. Ensure code compiles.
6. Dependencies: Prefer standard library. When new libraries are needed, provide a Maven pom.xml snippet. Avoid non-essential or non-standard libs.
7. Code quality: Favor immutability, small pure functions, SOLID, dependency injection, no static mutable state.
8. Error handling: Throw specific exceptions; cover them with tests.
9. Documentation: Minimal comments; JavaDoc only on public APIs.
10. Constraints: Linux environment; ensure compatibility with Eclipse.