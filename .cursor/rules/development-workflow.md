# System Development Workflow

## Development Flow

The following development workflow **MUST** be adhered to:

1. **Domain Design (DDD)**

   - Identify and define domain models
   - Establish ubiquitous language
   - Define bounded contexts
   - Identify aggregates and entities

2. **Endpoint Design**

   - Define RESTful APIs
   - Design request/response structures
   - Define error handling strategies
   - Specify authentication/authorization requirements

3. **Database Design**

   - Define table structures
   - Define relationships
   - Design indexes
   - Establish migration strategies

4. **Module Design**

   - Design classes/components
   - Organize dependencies
   - Define interfaces
   - Define architecture

5. **Design Verification**

   - Verify that design documentation exists for the feature being implemented
   - If design is insufficient, return to the design phase

6. **TDD Implementation**

   - Create tests for minimal functionality (methods)
   - Verify that tests fail initially
   - Develop implementation
   - Iterate until tests pass

7. **Iteration and Progress**
   - Move on to implementing the next method only after current tests pass
   - Revisit design as needed

## Mandatory Checklists

### Domain Design Checklist

- [ ] Domain models MUST be clearly defined
- [ ] Ubiquitous language MUST be documented
- [ ] Bounded contexts MUST be appropriately separated
- [ ] Aggregate boundaries MUST be clear

### Endpoint Design Checklist

- [ ] All necessary endpoints MUST be defined
- [ ] Request/response structures MUST be appropriate
- [ ] Error handling MUST be consistent
- [ ] Security requirements MUST be considered

### Database Design Checklist

- [ ] Schema MUST be normalized
- [ ] Indexes MUST be appropriately set
- [ ] Migration strategy MUST be defined
- [ ] Performance requirements MUST be considered

### Test Implementation Checklist

- [ ] Tests MUST accurately reflect functional requirements
- [ ] Edge cases MUST be covered
- [ ] Tests MUST be independent and reproducible
- [ ] Test code MUST be readable and maintainable

## Required Practices

- Design documentation MUST be kept up-to-date
- Design MUST be reviewed before implementation
- TDD cycles MUST be maintained for all functional units
- Consistency with design MUST be verified during code reviews
- Regular refactoring MUST be performed to reduce technical debt
