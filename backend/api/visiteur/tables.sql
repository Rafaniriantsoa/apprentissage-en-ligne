
CREATE TABLE `cours` (
  `id_cours` int(11) NOT NULL,
  `id_formateur` int(11) NOT NULL,
  `titre` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `est_publie` tinyint(1) NOT NULL DEFAULT 0,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `inscription` (
  `id_utilisateur` int(11) NOT NULL,
  `id_cours` int(11) NOT NULL,
  `date_inscription` timestamp NOT NULL DEFAULT current_timestamp(),
  `statut` enum('En cours','Terminé','Abandonné') NOT NULL DEFAULT 'En cours'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `lecon` (
  `id_lecon` int(11) NOT NULL,
  `id_cours` int(11) NOT NULL,
  `titre_lecon` varchar(255) NOT NULL,
  `contenu` varchar(255) DEFAULT NULL,
  `ordre` int(11) NOT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp(),
  `id_formateur` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `note` (
  `id_note` int(11) NOT NULL,
  `id_utilisateur` int(11) NOT NULL,
  `id_cours` int(11) NOT NULL,
  `valeur` int(11) DEFAULT NULL CHECK (`valeur` between 1 and 5),
  `commentaire` text DEFAULT NULL,
  `date_note` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `progression` (
  `id_utilisateur` int(11) NOT NULL,
  `id_lecon` int(11) NOT NULL,
  `etat_lecon` enum('Vue','Terminée') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `proposition` (
  `id_proposition` int(11) NOT NULL,
  `id_question` int(11) NOT NULL,
  `texte_proposition` varchar(255) NOT NULL,
  `est_correct` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--

CREATE TABLE `question` (
  `id_question` int(11) NOT NULL,
  `id_quiz` int(11) NOT NULL,
  `texte_question` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `quiz` (
  `id_quiz` int(11) NOT NULL,
  `id_cours` int(11) NOT NULL,
  `titre_quiz` varchar(255) NOT NULL,
  `ordre` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `reponse_utilisateur` (
  `id_utilisateur` int(11) NOT NULL,
  `id_question` int(11) NOT NULL,
  `id_proposition_choisie` int(11) NOT NULL,
  `est_correct` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `resultat_quiz` (
  `id_resultat` int(11) NOT NULL,
  `id_utilisateur` int(11) NOT NULL,
  `id_quiz` int(11) NOT NULL,
  `score_obtenu` decimal(5,2) DEFAULT NULL,
  `date_passage` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `utilisateur` (
  `id_utilisateur` int(11) NOT NULL,
  `nom_complet` varchar(255) NOT NULL,
  `email` varchar(150) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `role` enum('etudiant','formateur','admin') NOT NULL,
  `specialite` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
