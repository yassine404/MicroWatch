# Étape 1 : Build avec Maven
FROM maven:3.9-eclipse-temurin-21-alpine AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

# Étape 2 : Image légère pour l’exécution
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8098

ENTRYPOINT ["java", "-jar", "app.jar"]