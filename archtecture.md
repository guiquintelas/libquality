# NestJS

 I find the structured provided out of the box in the NestJs framework to be pretty straightforward and really scalable

 - Modules
 - Controllers
 - Services
 - Repository
 - Entity

It's basically a future proof monolith ready to be broken into a micro-service structure if needed

# Database

The database in the end was pretty simple, the main non conventional decision was to store the entire github json response for each `Repo` as a json column, the reason behind that was to future proof the application, any data processing needed in the future would be backwards compatible with the old data, a simple database migration would be enough to populate old records with the new processed data.

A example would be the `Phase 3`, adding stars, forks #contributors and also issue grouped by labels. All this data is already present in each row of the `Repo` table, it's a matter of creating a migration to process the json column and extract it to its own column

# Session

To store user data I opt for using the old and simple session, this was done mostly by time constraints and to not over complicate a feature tha wasn't directly asked for

# Docker

I find almost required to have a `docker-compose.yml` to setup all the external services necessary to run the application. I gives productivity to the developer and lowers the change of configuration errors
