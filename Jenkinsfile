pipeline {
  agent any

  tools {
    nodejs 'node20'
  }

  stages {
    stage('frontend - Install & Test') {
      steps {
        dir('frontend') {
          sh 'node -v'
          sh 'npm -v'
          sh 'npm install'
          sh 'npm test'
        }
      }
    }

    stage('Backend - Install & Test') {
      steps {
        dir('backend') {
          sh 'npm install'
          sh 'npm test'
        }
      }
    }

    stage('Build Docker Image') {
      steps {
        // אם ה-Dockerfile בשורש הריפו - להשאיר ככה.
        // אם הוא בתוך frontend/backend - תגידי לי איפה והוא צריך להיות בתוך dir('...').
        sh "docker build -t my-node-app:${env.BUILD_NUMBER} ."
      }
    }

    stage('Deploy (Docker)') {
      steps {
        sh "docker stop my-app || true"
        sh "docker rm my-app || true"
        sh "docker run -d --name my-app -p 3000:3000 my-node-app:${env.BUILD_NUMBER}"
      }
    }
  }
}
