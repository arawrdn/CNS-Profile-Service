# CNS Profile Service

The CNS Profile Service is a decentralized profile data storage solution built on Stacks L2, designed to be composed with the **Clarity Name Service (CNS)**.

It allows the verified owner of a CNS domain name (an SIP-009 NFT) to manage and update profile metadata, such as an avatar URL and a biographical description, linked to their human-readable name.

## 🔗 Contract Composability

This project strictly relies on the `cns-registrar` contract (from the related CNS project) as an external dependency to verify ownership and name existence. This showcases secure and composable contract design in the Clarity ecosystem.

## 🛠️ Project Structure

* **`contracts/cns-profile.clar`**: The core contract for profile data storage and ownership verification.
* **`tests/cns-profile_test.ts`**: The Clarinet test suite ensuring only the verified CNS name owner can modify their profile.
* **`Clarinet.toml`**: Configuration defining the dependency on the `cns-registrar` contract.

## Getting Started

### Prerequisites

* [Clarinet](https://docs.stacks.co/write-smart-contracts/clarinet) (The Stacks smart contract toolchain)
* The `cns-registrar.clar` file must be present in the `/contracts` directory for local testing.

### Installation and Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/arawrdn/cns-profile-service.git](https://github.com/your-username/cns-profile-service.git)
    cd cns-profile-service
    ```

2.  **Ensure Dependencies:**
    Make sure you have copied the `cns-registrar.clar` file into the `contracts/` directory from the Clarity Name Service project.

3.  **Run Tests:**
    ```bash
    clarinet test
    ```

## Contract Overview

The main functionality revolves around the `set-profile` public function, which calls the `resolve-name` function on the `cns-registrar` contract to confirm the caller's identity before allowing any data modification.

## Contributing

Contributions are welcome! This project focuses on demonstrating security and composability in Clarity. All contributions should adhere to the standards for meaningful PRs for the **Code for STX** program.
