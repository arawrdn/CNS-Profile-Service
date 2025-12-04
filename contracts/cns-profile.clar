;; Traits (Interfaces) must be defined for external contract calls
;; Since we don't have the trait file, we define the principal directly for the REPL/Test environment.
;; In production, a trait definition would be preferred.

;; Define the principal of the deployed CNS Registrar contract
(define-constant REGISTRAR-CONTRACT 'ST1PQHQKV0RJQDZKYR4T6YVRQND4K41GC7S1B1KBT.cns-registrar)

;; Map to store the profile data: keyed by CNS name
(define-map user-profiles 
    {name: (string-ascii 20)} 
    {
        avatar-url: (string-utf8 256), 
        bio: (string-utf8 160)
    }
)

;; Constants for Error Handling
(define-constant ERR-NOT-OWNER (err u200))
(define-constant ERR-NAME-NOT-REGISTERED (err u201))

;; --- READ-ONLY FUNCTION ---

;; Retrieves the profile data for a given CNS name
(define-read-only (get-profile (name (string-ascii 20)))
    (ok (map-get? user-profiles {name: name}))
)

;; --- PRIVATE FUNCTION ---

;; Asserts that the transaction sender is the verified owner of the CNS name
(define-private (assert-is-name-owner (name (string-ascii 20)))
    (let 
        ((owner-response (contract-call? REGISTRAR-CONTRACT resolve-name name)))
        
        ;; 1. Check if the name resolution was successful
        (asserts! (is-ok owner-response) ERR-NAME-NOT-REGISTERED)

        (let 
            ((resolution-data (unwrap-panic owner-response)))
            
            ;; 2. Check if the Stacks address in the resolution data matches the tx-sender
            ;; We use unwrap-panic assuming a registered name must have a stacks-addr
            (asserts! (is-eq (get stacks-addr (unwrap-panic resolution-data)) tx-sender) ERR-NOT-OWNER)
        )
        (ok true)
    )
)

;; --- PUBLIC FUNCTION ---

;; Allows the owner of the CNS name to set or update their profile data
(define-public (set-profile (name (string-ascii 20)) (avatar-url (string-utf8 256)) (bio (string-utf8 160)))
    (begin
        ;; 1. Verify ownership via the CNS Registrar contract
        (try! (assert-is-name-owner name))
        
        ;; 2. Update the profile map
        (map-set user-profiles 
            {name: name} 
            {avatar-url: avatar-url, bio: bio}
        )
        (ok true)
    )
)
