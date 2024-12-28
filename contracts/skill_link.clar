;; SkillLink - Freelancer Networking Platform

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-unauthorized (err u102))
(define-constant err-already-exists (err u103))

;; Data Variables
(define-data-var next-profile-id uint u1)
(define-data-var next-job-id uint u1)

;; Data Maps
(define-map Profiles
    uint 
    {
        owner: principal,
        name: (string-ascii 50),
        skills: (string-ascii 500),
        rating: uint,
        rating-count: uint,
        active: bool
    }
)

(define-map Jobs
    uint
    {
        client: principal,
        title: (string-ascii 100),
        description: (string-ascii 1000),
        budget: uint,
        status: (string-ascii 20),
        freelancer: (optional principal)
    }
)

(define-map UserProfiles
    principal
    uint
)

;; Profile Management
(define-public (create-profile (name (string-ascii 50)) (skills (string-ascii 500)))
    (let 
        (
            (profile-id (var-get next-profile-id))
        )
        (asserts! (is-none (map-get? UserProfiles tx-sender)) err-already-exists)
        (map-set Profiles profile-id {
            owner: tx-sender,
            name: name,
            skills: skills,
            rating: u0,
            rating-count: u0,
            active: true
        })
        (map-set UserProfiles tx-sender profile-id)
        (var-set next-profile-id (+ profile-id u1))
        (ok profile-id)
    )
)

;; Job Management
(define-public (post-job (title (string-ascii 100)) (description (string-ascii 1000)) (budget uint))
    (let
        (
            (job-id (var-get next-job-id))
        )
        (map-set Jobs job-id {
            client: tx-sender,
            title: title,
            description: description,
            budget: budget,
            status: "open",
            freelancer: none
        })
        (var-set next-job-id (+ job-id u1))
        (ok job-id)
    )
)

(define-public (accept-job (job-id uint))
    (let
        (
            (job (unwrap! (map-get? Jobs job-id) err-not-found))
        )
        (asserts! (is-eq (get status job) "open") err-unauthorized)
        (map-set Jobs job-id (merge job {
            status: "in-progress",
            freelancer: (some tx-sender)
        }))
        (ok true)
    )
)

;; Rating System
(define-public (rate-freelancer (profile-id uint) (rating uint))
    (let
        (
            (profile (unwrap! (map-get? Profiles profile-id) err-not-found))
        )
        (asserts! (<= rating u5) (err u104))
        (map-set Profiles profile-id (merge profile {
            rating: (+ (get rating profile) rating),
            rating-count: (+ (get rating-count profile) u1)
        }))
        (ok true)
    )
)

;; Read-only functions
(define-read-only (get-profile (profile-id uint))
    (map-get? Profiles profile-id)
)

(define-read-only (get-job (job-id uint))
    (map-get? Jobs job-id)
)