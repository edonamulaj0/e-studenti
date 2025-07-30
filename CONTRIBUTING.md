# Contributing to e-studenti

We welcome contributions to the `e-studenti` project\! Whether you're fixing a bug, adding a new feature, or improving documentation, your help is greatly appreciated.

Please take a moment to review this document to understand how to contribute effectively.

## Code of Conduct

This project and everyone participating in it is governed by the [Code of Conduct](https://github.com/edonamulaj0/e-studenti/blob/main/CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

  * **Ensure the bug hasn't already been reported.** Search the [issue tracker](https://github.com/edonamulaj0/e-studenti/issues) to see if someone has already reported the problem.
  * **Check if the issue has been fixed.** Try to reproduce the bug on the latest `main` branch.
  * **Open a new issue:** If you can't find an existing issue, open a new one.
      * Clearly describe the bug, including steps to reproduce it.
      * Provide specific examples (e.g., code snippets, error messages, screenshots) to help us understand the problem.
      * Explain the expected behavior and what actually happened.
      * Mention your operating system, browser, and any relevant software versions.

### Suggesting Enhancements

  * **Check for existing suggestions.** Search the [issue tracker](https://github.com/edonamulaj0/e-studenti/issues) to see if the enhancement has already been discussed.
  * **Open a new issue:** If you have a new idea, open an issue.
      * Clearly describe the enhancement and its benefits.
      * Explain why this enhancement would be useful to other users.
      * Provide examples of how it might be used.
      * If applicable, propose a high-level technical approach.

### Your First Code Contribution

Unsure where to begin contributing to `e-studenti`? You can start by looking for `good first issue` or `help wanted` labels in the [issue tracker](https://github.com/edonamulaj0/e-studenti/issues).

### Contributing Code

The general process for contributing code is as follows:

1.  **Fork the repository:** Click the "Fork" button on the top right of the [e-studenti GitHub page](https://github.com/edonamulaj0/e-studenti).
2.  **Clone your forked repository:**
    ```bash
    git clone https://github.com/edonamulaj0/e-studenti.git
    cd e-studenti
    ```
3.  **Create a new branch:**
    ```bash
    git checkout -b feature/your-feature-name-or-bugfix/your-bug-fix-name
    ```
    (Choose a descriptive name, e.g., `feature/add-dark-mode` or `bugfix/fix-login-error`)
4.  **Make your changes:** Implement your feature or bug fix.
5.  **Write tests (if applicable):** Ensure your changes don't break existing functionality and cover new functionality.
6.  **Run tests locally:** Make sure all tests pass.
7.  **Commit your changes:** Write clear, concise commit messages.
    ```bash
    git add .
    git commit -m "feat: Add dark mode toggle"
    # or
    git commit -m "fix: Resolve login authentication error"
    ```
    (Consider following Conventional Commits guidelines)
8.  **Push your branch to your fork:**
    ```bash
    git push origin feature/your-feature-name
    ```
9.  **Open a Pull Request (PR):**
      * Go to your forked repository on GitHub and click the "Compare & pull request" button.
      * Provide a clear and detailed description of your changes.
      * Reference any related issues (e.g., `Closes #123`, `Fixes #456`).
      * Ensure all checks (if any automated CI/CD) pass.

## Pull Request Guidelines

  * **One logical change per PR:** If you have multiple unrelated changes, split them into separate PRs.
  * **Descriptive title and body:** Explain what your PR does, why it's needed, and how it was implemented.
  * **Tests:** If your change introduces new functionality or fixes a bug, please include appropriate tests.
  * **Documentation:** Update any relevant documentation (e.g., `README.md`, comments in code) for your changes.
  * **Keep PRs small:** Smaller PRs are easier to review.
  * **Address feedback:** Be responsive to comments and suggestions during the review process.

## Development Setup

To set up the `e-studenti` project locally for development:

1.  **Prerequisites:** Ensure you have the necessary tools installed (e.g., Node.js, npm/yarn, Java, Maven/Gradle, Python, etc., depending on the project's tech stack). *Please refer to the `README.md` for specific technical requirements.*
2.  **Clone the repository:**
    ```bash
    git clone https://github.com/edonamulaj0/e-studenti.git
    cd e-studenti
    ```
3.  **Install dependencies:**
    ```bash
    # Example for Node.js projects
    npm install
    # or yarn
    yarn install

    # Example for Java/Maven projects
    mvn install
    ```
4.  **Run the application:**
    ```bash
    # Example for Node.js projects
    npm start
    # or yarn
    yarn start

    # Example for Java/Spring Boot projects
    mvn spring-boot:run
    ```

Thank you for contributing to `e-studenti`\!
