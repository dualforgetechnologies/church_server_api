/**
 * @swagger
 * components:
 *   responses:
 *     UnauthorizedError:
 *       description: Unauthorized – authentication token missing or invalid
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: "error"
 *               message:
 *                 type: string
 *                 example: "Authentication token missing or invalid."
 *               type:
 *                 type: string
 *                 example: "Unauthorized"
 *
 *     ForbiddenError:
 *       description: Forbidden – insufficient permissions
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: "error"
 *               message:
 *                 type: string
 *                 example: "Access denied due to insufficient permissions."
 *               type:
 *                 type: string
 *                 example: "Forbidden"
 *
 *     BadRequestError:
 *       description: Bad request – invalid data
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: "error"
 *               message:
 *                 type: string
 *                 example: "Provided data is invalid or malformed."
 *               type:
 *                 type: string
 *                 example: "BadRequest"
 *
 *     InternalServerError:
 *       description: Internal server error
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: "error"
 *               message:
 *                 type: string
 *                 example: "An unexpected error occurred on the server."
 *               type:
 *                 type: string
 *                 example: "InternalServerError"
 *     NotFoundError:
 *       description: Resource not found
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: "error"
 *               message:
 *                 type: string
 *                 example: "The requested resource could not be found."
 *               type:
 *                 type: string
 *                 example: "NotFound"
 *     ErrorResponse:
 *       description: Error message
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: "error"
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 */

/****  USEFULL COMMON PARAMETERS **/

/**
 * @swagger
 * components:
 *   parameters:
 *     UserIdParam:
 *       name: userId
 *       in: query
 *       required: false
 *       schema:
 *         type: string
 *         format: uuid
 *       description: Filter by  user ID
 *
 *     CustomerIdParam:
 *       name: customerId
 *       in: query
 *       required: false
 *       schema:
 *         type: string
 *         format: cuid
 *       description: Filter by  customer ID
 *     SearchParam:
 *       name: search
 *       in: query
 *       schema:
 *         type: string
 *       description: Free-text search in schema fields
 *
 *     DateFromParam:
 *       name: dateFrom
 *       in: query
 *       required: false
 *       schema:
 *         type: string
 *         format: date-time
 *         example: "2025-07-01T00:00:00Z"
 *       description: Filter records occurring after this date
 *
 *     DateToParam:
 *       name: dateTo
 *       in: query
 *       required: false
 *       schema:
 *         type: string
 *         format: date-time
 *         example: "2025-07-31T23:59:59Z"
 *       description: Filter records occurring before this date
 *     BranchIdParam:
 *       name: branchId
 *       in: query
 *       required: false
 *       schema:
 *         type: string
 *       description: Filter records by branch
 *
 *
 *     IsDeletedParam:
 *       name: isDeleted
 *       in: query
 *       required: false
 *       schema:
 *         type: boolean
 *       example: false
 *       description: Whether to include deleted records
 *     IsActiveParam:
 *       name: isActive
 *       in: query
 *       required: false
 *       schema:
 *         type: boolean
 *       description: Whether to include isActive records
 *     IsVerifiedParam:
 *       name: isVerified
 *       in: query
 *       required: false
 *       schema:
 *         type: boolean
 *       description: Whether to include isVerified records
 *     ParentCategoryIdParam:
 *       name: parentId
 *       in: query
 *       required: false
 *       schema:
 *         type: boolean
 *       description: fetch children category or a specified parent category
 *     ListingIdIdParam:
 *       name: listingId
 *       in: path
 *       description: Target listing ID
 *       required: true
 *       schema: { type: string, example: "ckxz1j2ce0000vsmk3zdf0n3q" }
 *     ListingIdIdQuery:
 *       name: listingId
 *       in: query
 *       description: Target listing ID
 *       required: false
 *       schema: { type: string, example: "ckxz1j2ce0000vsmk3zdf0n3q" }
 *     FromDateParam:
 *       in: query
 *       name: fromDate
 *       schema:
 *         type: string
 *         format: date-time
 *         example: "2025-07-01T00:00:00Z"
 *       description: Start date for filtering

 *     ToDateParam:
 *       in: query
 *       name: toDate
 *       schema:
 *         type: string
 *         format: date-time
 *         example: "2025-07-31T23:59:59Z"
 *       description: End date for filtering
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CustomerInteraction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "a7b3e97e-1234-4fa5-899f-c5e12b7d9d31"
 *         customerId:
 *           type: string
 *           format: uuid
 *           example: "f4bcf891-5aef-4d56-b56f-08d79fb35eb2"
 *         customer:
 *           $ref: '#/components/schemas/Customer'
 *         channel:
 *           type: string
 *           enum: [CALL, EMAIL, MEETING, SUPPORT, OTHER]
 *           example: "CALL"
 *         type:
 *           type: string
 *           enum: [INBOUND, OUTBOUND, FOLLOW_UP, DEMO, SYSTEM]
 *           example: "OUTBOUND"
 *         subject:
 *           type: string
 *           example: "Product demo discussion"
 *         description:
 *           type: string
 *           example: "Walked the client through product features and gathered feedback."
 *         userId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           example: "ad3f2a90-3c12-4b7c-b932-000af02e56c3"
 *         user:
 *           $ref: '#/components/schemas/User'
 *         date:
 *           type: string
 *           format: date-time
 *           example: "2025-07-26T14:45:00Z"
 *         duration:
 *           type: integer
 *           nullable: true
 *           description: Duration in minutes
 *           example: 30
 *         outcome:
 *           type: string
 *           nullable: true
 *           example: "Interested in follow-up"
 *         notes:
 *           type: string
 *           nullable: true
 *           example: "Follow up in 2 weeks"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-07-26T14:50:00Z"
 *         organizationId:
 *           type: string
 *           format: uuid
 *           example: "6f7541d9-b013-4c27-ae03-1d4304c20561"
 *         organization:
 *           $ref: '#/components/schemas/Organization'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "cust_001"
 *         firstName:
 *           type: string
 *           example: "John"
 *         lastName:
 *           type: string
 *           example: "Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Organization:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "ckw1yjeyg0000z7o6k2iy4r4g"
 *         organizationName:
 *           type: string
 *           example: "Novanta Home Essentials"
 *         description:
 *           type: string
 *           nullable: true
 *           example: "Retail brand offering premium-quality home essentials including furniture, kitchenware, and décor."
 *         logo:
 *           type: string
 *           nullable: true
 *           example: "https://cdn.example.com/logos/novanta.png"
 *         slug:
 *           type: string
 *           example: "novanta-home-essentials"
 *         industry:
 *           type: string
 *           nullable: true
 *           example: "Retail"
 *         foundingDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2016-03-10T00:00:00Z"
 *         primaryLocation:
 *           type: string
 *           nullable: true
 *           example: "Lagos, Nigeria"
 *         website:
 *           type: string
 *           nullable: true
 *           example: "https://novanta.store"
 *         socialMedia:
 *           type: object
 *           nullable: true
 *           additionalProperties:
 *             type: string
 *           example:
 *             instagram: "https://instagram.com/novanta.store"
 *             facebook: "https://facebook.com/novanta.store"
 *         billingEmail:
 *           type: string
 *           format: email
 *           nullable: true
 *           example: "accounts@novanta.store"
 *         users:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *         customers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Customer'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-07-27T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-07-27T12:00:00Z"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "user_001"
 *         firstName:
 *           type: string
 *           example: "Jane"
 *         lastName:
 *           type: string
 *           example: "Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "jane.doe@example.com"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LeadResponse:
 *       type: object
 *       description: Full lead data returned from the API.
 *       properties:
 *         id:
 *           type: string
 *           example: "clz1b2c3d4e5f6g7h8i9"
 *         firstName:
 *           type: string
 *           example: "Tobi"
 *         lastName:
 *           type: string
 *           example: "Layefa"
 *         email:
 *           type: string
 *           format: email
 *           example: "tobi@example.com"
 *         phone:
 *           type: string
 *           nullable: true
 *           example: "+233201234567"
 *         company:
 *           type: string
 *           nullable: true
 *           example: "Acme Ltd"
 *         jobTitle:
 *           type: string
 *           nullable: true
 *           example: "Product Manager"
 *         source:
 *           type: string
 *           nullable: true
 *           example: "referral"
 *         status:
 *           $ref: '#/components/schemas/LeadStatus'
 *         assignedTo:
 *           type: string
 *           nullable: true
 *           example: "user_10872685"
 *         interest:
 *           type: string
 *           nullable: true
 *           example: "Enterprise plan"
 *         budget:
 *           type: number
 *           format: double
 *           nullable: true
 *           example: 12000
 *         convertedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2025-08-01T12:00:00Z"
 *         score:
 *           type: integer
 *           format: int32
 *           default: 0
 *           example: 10
 *         scoreBreakdown:
 *           type: object
 *           nullable: true
 *           additionalProperties:
 *             type: number
 *           example:
 *             activity: 5
 *             demographics: 3
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-07-01T09:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-08-01T09:00:00Z"
 *         organizationId:
 *           type: string
 *           example: "org_123456"
 *         branchId:
 *           type: string
 *           nullable: true
 *           example: "branch_01"
 *         industry:
 *           type: string
 *           nullable: true
 *           example: "Software"
 *         companySize:
 *           type: string
 *           nullable: true
 *           example: "11-50"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["trial", "priority"]
 *         notes:
 *           type: string
 *           nullable: true
 *           example: "Interested in pilot program Q4."
 *         socialMediaLinks:
 *           type: object
 *           nullable: true
 *           additionalProperties:
 *             type: string
 *           example:
 *             linkedin: "https://linkedin.com/in/tobi"
 *             twitter: "https://twitter.com/tobi"
 *         lastContactDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2025-07-25T09:30:00Z"
 *         nextFollowUpDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2025-08-20T10:00:00Z"
 *         isDeleted:
 *           type: boolean
 *           default: false
 *           example: false
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         organization:
 *           $ref: '#/components/schemas/Organization'
 *         assignedUser:
 *           $ref: '#/components/schemas/UserResponse'
 */

/*
 * @swagger
 * components:
 *   parameters:
 *     IdParam:
 *       name: id
 *       in: path
 *       description: Unique identifier of the resource
 *       required: true
 *       schema:
 *         type: string
 *         example: "clj123abc0000xyz"
 */
