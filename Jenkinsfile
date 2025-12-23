pipeline {
  agent any

  tools {
    nodejs 'node20'
  }

  stages {
    stage('Frontend - Install & Test') {
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

    stage('Build Docker Images') {
      steps {
        sh "docker build -t smart-frontend:${env.BUILD_NUMBER} -f frontend/Dockerfile frontend"
        sh "docker build -t smart-backend:${env.BUILD_NUMBER} -f backend/Dockerfile backend"
      }
    }

    stage('Deploy (Docker)') {
      steps {
        // Backend (שני ב-3001 לדוגמה)
        sh "docker stop smart-backend || true"
        sh "docker rm smart-backend || true"
        sh "docker run -d --name smart-backend -p 3001:3000 smart-backend:${env.BUILD_NUMBER}"

        // Frontend (ב-3000)
        sh "docker stop smart-frontend || true"
        sh "docker rm smart-frontend || true"
        sh "docker run -d --name smart-frontend -p 3000:3000 smart-frontend:${env.BUILD_NUMBER}"
      }
    }
  }
}
