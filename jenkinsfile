pipeline {
    agent any

    stages {
        stage('Install Dependencies') {
            steps {
                // התקנת חבילות לצורך הבדיקות
                sh 'npm install'
            }
        }

        stage('Run Unit Tests') {
            steps {
                // הרצת הטסטים - אם שלב זה נכשל, ה-Pipeline יעצור
                sh 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // בניית האימג' עם תגית של מספר הבילד
                    sh "docker build -t my-node-app:${env.BUILD_NUMBER} ."
                }
            }
        }

        stage('Deploy (Docker)') {
            steps {
                script {
                    sh "docker stop my-app || true"
                    sh "docker rm my-app || true"
                    sh "docker run -d --name my-app -p 3000:3000 my-node-app:${env.BUILD_NUMBER}"
                }
            }
        }
    }
}