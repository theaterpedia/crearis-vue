--
-- PostgreSQL database dump
--

-- Dumped from database version 12.22 (Ubuntu 12.22-0ubuntu0.20.04.4)
-- Dumped by pg_dump version 12.22 (Ubuntu 12.22-0ubuntu0.20.04.4)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: crearis_admin
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO crearis_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: crearis_config; Type: TABLE; Schema: public; Owner: crearis_admin
--

CREATE TABLE public.crearis_config (
    id integer NOT NULL,
    config jsonb NOT NULL
);


ALTER TABLE public.crearis_config OWNER TO crearis_admin;

--
-- Name: crearis_config_id_seq; Type: SEQUENCE; Schema: public; Owner: crearis_admin
--

CREATE SEQUENCE public.crearis_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.crearis_config_id_seq OWNER TO crearis_admin;

--
-- Name: crearis_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: crearis_admin
--

ALTER SEQUENCE public.crearis_config_id_seq OWNED BY public.crearis_config.id;


--
-- Name: events; Type: TABLE; Schema: public; Owner: crearis_admin
--

CREATE TABLE public.events (
    id text NOT NULL,
    name text NOT NULL,
    date_begin text,
    date_end text,
    address_id text,
    user_id text,
    seats_max integer,
    cimg text,
    header_type text,
    rectitle text,
    teaser text,
    version_id text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at text,
    status text DEFAULT 'active'::text,
    isbase integer DEFAULT 0,
    CONSTRAINT events_status_check CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text, 'deleted'::text])))
);


ALTER TABLE public.events OWNER TO crearis_admin;

--
-- Name: hero_overrides; Type: TABLE; Schema: public; Owner: crearis_admin
--

CREATE TABLE public.hero_overrides (
    id text NOT NULL,
    cimg text,
    heading text,
    description text,
    event_ids text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at text
);


ALTER TABLE public.hero_overrides OWNER TO crearis_admin;

--
-- Name: instructors; Type: TABLE; Schema: public; Owner: crearis_admin
--

CREATE TABLE public.instructors (
    id text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    city text,
    country_id text,
    cimg text,
    description text,
    event_id text,
    version_id text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at text,
    status text DEFAULT 'active'::text,
    CONSTRAINT instructors_status_check CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text, 'deleted'::text])))
);


ALTER TABLE public.instructors OWNER TO crearis_admin;

--
-- Name: locations; Type: TABLE; Schema: public; Owner: crearis_admin
--

CREATE TABLE public.locations (
    id text NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    city text,
    zip text,
    street text,
    country_id text,
    is_company text,
    category_id text,
    cimg text,
    header_type text,
    header_size text,
    md text,
    is_location_provider text,
    event_id text,
    version_id text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at text,
    status text DEFAULT 'active'::text,
    CONSTRAINT locations_status_check CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text, 'deleted'::text])))
);


ALTER TABLE public.locations OWNER TO crearis_admin;

--
-- Name: participants; Type: TABLE; Schema: public; Owner: crearis_admin
--

CREATE TABLE public.participants (
    id text NOT NULL,
    name text NOT NULL,
    age integer,
    city text,
    country_id text,
    cimg text,
    description text,
    event_id text,
    type text,
    version_id text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at text,
    status text DEFAULT 'active'::text,
    CONSTRAINT participants_status_check CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text, 'deleted'::text])))
);


ALTER TABLE public.participants OWNER TO crearis_admin;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: crearis_admin
--

CREATE TABLE public.posts (
    id text NOT NULL,
    name text NOT NULL,
    subtitle text,
    teaser text,
    author_id text,
    blog_id text,
    tag_ids text,
    website_published text,
    is_published text,
    post_date text,
    cover_properties text,
    event_id text,
    cimg text,
    version_id text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at text,
    status text DEFAULT 'active'::text,
    CONSTRAINT posts_status_check CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text, 'deleted'::text])))
);


ALTER TABLE public.posts OWNER TO crearis_admin;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: crearis_admin
--

CREATE TABLE public.projects (
    id text NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL,
    name text,
    description text,
    status text DEFAULT 'draft'::text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at text,
    CONSTRAINT projects_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'base'::text, 'project'::text]))),
    CONSTRAINT projects_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'archived'::text])))
);


ALTER TABLE public.projects OWNER TO crearis_admin;

--
-- Name: record_versions; Type: TABLE; Schema: public; Owner: crearis_admin
--

CREATE TABLE public.record_versions (
    id text NOT NULL,
    version_id text NOT NULL,
    record_type text NOT NULL,
    record_id text NOT NULL,
    data text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.record_versions OWNER TO crearis_admin;

--
-- Name: releases; Type: TABLE; Schema: public; Owner: crearis_admin
--

CREATE TABLE public.releases (
    id text NOT NULL,
    version text NOT NULL,
    version_major integer NOT NULL,
    version_minor integer NOT NULL,
    description text,
    state text DEFAULT 'idea'::text,
    release_date text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at text,
    CONSTRAINT releases_state_check CHECK ((state = ANY (ARRAY['idea'::text, 'draft'::text, 'final'::text, 'trash'::text])))
);


ALTER TABLE public.releases OWNER TO crearis_admin;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: crearis_admin
--

CREATE TABLE public.tasks (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'idea'::text,
    category text DEFAULT 'project'::text,
    priority text DEFAULT 'medium'::text,
    record_type text,
    record_id text,
    assigned_to text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at text,
    due_date text,
    completed_at text,
    version_id text,
    release_id text,
    image text,
    prompt text,
    CONSTRAINT tasks_category_check CHECK ((category = ANY (ARRAY['project'::text, 'base'::text, 'admin'::text]))),
    CONSTRAINT tasks_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT tasks_status_check CHECK ((status = ANY (ARRAY['idea'::text, 'draft'::text, 'final'::text, 'reopen'::text, 'trash'::text])))
);


ALTER TABLE public.tasks OWNER TO crearis_admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: crearis_admin
--

CREATE TABLE public.users (
    id text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    role text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'base'::text, 'project'::text, 'user'::text])))
);


ALTER TABLE public.users OWNER TO crearis_admin;

--
-- Name: versions; Type: TABLE; Schema: public; Owner: crearis_admin
--

CREATE TABLE public.versions (
    id text NOT NULL,
    version_number text NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by text,
    is_active integer DEFAULT 0,
    snapshot_data text,
    csv_exported integer DEFAULT 0,
    notes text
);


ALTER TABLE public.versions OWNER TO crearis_admin;

--
-- Name: crearis_config id; Type: DEFAULT; Schema: public; Owner: crearis_admin
--

ALTER TABLE ONLY public.crearis_config ALTER COLUMN id SET DEFAULT nextval('public.crearis_config_id_seq'::regclass);


--
-- Data for Name: crearis_config; Type: TABLE DATA; Schema: public; Owner: crearis_admin
--

COPY public.crearis_config (id, config) FROM stdin;
1	{"version": "0.0.1", "migrations_run": ["002_align_schema"]}
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: crearis_admin
--

COPY public.events (id, name, date_begin, date_end, address_id, user_id, seats_max, cimg, header_type, rectitle, teaser, version_id, created_at, updated_at, status, isbase) FROM stdin;
\.


--
-- Data for Name: hero_overrides; Type: TABLE DATA; Schema: public; Owner: crearis_admin
--

COPY public.hero_overrides (id, cimg, heading, description, event_ids, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: instructors; Type: TABLE DATA; Schema: public; Owner: crearis_admin
--

COPY public.instructors (id, name, email, phone, city, country_id, cimg, description, event_id, version_id, created_at, updated_at, status) FROM stdin;
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: crearis_admin
--

COPY public.locations (id, name, phone, email, city, zip, street, country_id, is_company, category_id, cimg, header_type, header_size, md, is_location_provider, event_id, version_id, created_at, updated_at, status) FROM stdin;
\.


--
-- Data for Name: participants; Type: TABLE DATA; Schema: public; Owner: crearis_admin
--

COPY public.participants (id, name, age, city, country_id, cimg, description, event_id, type, version_id, created_at, updated_at, status) FROM stdin;
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: crearis_admin
--

COPY public.posts (id, name, subtitle, teaser, author_id, blog_id, tag_ids, website_published, is_published, post_date, cover_properties, event_id, cimg, version_id, created_at, updated_at, status) FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: crearis_admin
--

COPY public.projects (id, username, password_hash, role, name, description, status, created_at, updated_at) FROM stdin;
AxcMhS9v1iHhxy_JvMcxG	project1	$2b$10$fILrq1JS/3sQbyJDGFug8.8YIQM1Vi.14QL229uWqYEmgEWSb2.za	project	project1	\N	active	2025-10-15 14:26:30.014198	\N
37-AG8bBN1OX6ujJ7Ltf_	project2	$2b$10$X.a/3etBHGWIgeOwjnA2qOKlfuGDv8ZCbrp.KikYLKTdzWRqrPleq	project	project2	\N	active	2025-10-15 14:26:30.077724	\N
gG5Fl7OGqJvL-9FuWetja	admin	$2b$10$Y8AJ/9rP3Y08r.IZHGYEiuekwrvBFTnwAhymjA4.u91lI8y1qNWCW	admin	admin	\N	active	2025-10-15 14:09:11.941042	2025-10-15 14:36:51.330797+02
VVX-DnlQQ6OxJYaaMzn4o	base	$2b$10$7D5Iq7lW1iHbhJn3lz41.OZVF/doP6QTOG.DC2BCbZ24r1.HjlYge	base	base	\N	active	2025-10-15 14:09:12.003257	2025-10-15 14:36:51.393714+02
\.


--
-- Data for Name: record_versions; Type: TABLE DATA; Schema: public; Owner: crearis_admin
--

COPY public.record_versions (id, version_id, record_type, record_id, data, created_at) FROM stdin;
\.


--
-- Data for Name: releases; Type: TABLE DATA; Schema: public; Owner: crearis_admin
--

COPY public.releases (id, version, version_major, version_minor, description, state, release_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: crearis_admin
--

COPY public.tasks (id, title, description, status, category, priority, record_type, record_id, assigned_to, created_at, updated_at, due_date, completed_at, version_id, release_id, image, prompt) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: crearis_admin
--

COPY public.users (id, username, password, role, created_at) FROM stdin;
AxcMhS9v1iHhxy_JvMcxG	project1	$2b$10$fILrq1JS/3sQbyJDGFug8.8YIQM1Vi.14QL229uWqYEmgEWSb2.za	project	2025-10-15 14:26:30.014
37-AG8bBN1OX6ujJ7Ltf_	project2	$2b$10$X.a/3etBHGWIgeOwjnA2qOKlfuGDv8ZCbrp.KikYLKTdzWRqrPleq	project	2025-10-15 14:26:30.077
gG5Fl7OGqJvL-9FuWetja	admin	$2b$10$Y8AJ/9rP3Y08r.IZHGYEiuekwrvBFTnwAhymjA4.u91lI8y1qNWCW	admin	2025-10-15 14:09:11.941
VVX-DnlQQ6OxJYaaMzn4o	base	$2b$10$7D5Iq7lW1iHbhJn3lz41.OZVF/doP6QTOG.DC2BCbZ24r1.HjlYge	base	2025-10-15 14:09:12.003
\.


--
-- Data for Name: versions; Type: TABLE DATA; Schema: public; Owner: crearis_admin
--

COPY public.versions (id, version_number, name, description, created_at, created_by, is_active, snapshot_data, csv_exported, notes) FROM stdin;
\.


--
-- Name: crearis_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: crearis_admin
--

SELECT pg_catalog.setval('public.crearis_config_id_seq', 1, true);


--
-- Name: crearis_config crearis_config_pkey; Type: CONSTRAINT; Schema: public; Owner: crearis_admin
--

ALTER TABLE ONLY public.crearis_config
    ADD CONSTRAINT crearis_config_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: crearis_admin
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: hero_overrides hero_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: crearis_admin
--

ALTER TABLE ONLY public.hero_overrides
    ADD CONSTRAINT hero_overrides_pkey PRIMARY KEY (id);


--
-- Name: instructors instructors_pkey; Type: CONSTRAINT; Schema: public; Owner: crearis_admin
--

ALTER TABLE ONLY public.instructors
    ADD CONSTRAINT instructors_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: crearis_admin
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: participants participants_pkey; Type: CONSTRAINT; Schema: public; Owner: crearis_admin
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: crearis_admin
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: crearis_admin
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: projects projects_username_key; Type: CONSTRAINT; Schema: public; Owner: crearis_admin
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_username_key UNIQUE (username);


--
-- Name: record_versions record_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: crearis_admin
--

ALTER TABLE ONLY public.record_versions
    ADD CONSTRAINT record_versions_pkey PRIMARY KEY (id);


--
-- Name: releases releases_pkey; Type: CONSTRAINT; Schema: public; Owner: crearis_admin
--

ALTER TABLE ONLY public.releases
    ADD CONSTRAINT releases_pkey PRIMARY KEY (id);


--
-- Name: releases releases_version_key; Type: CONSTRAINT; Schema: public; Owner: crearis_admin
--

ALTER TABLE ONLY public.releases
    ADD CONSTRAINT releases_version_key UNIQUE (version);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: crearis_admin
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: crearis_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: crearis_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: versions versions_pkey; Type: CONSTRAINT; Schema: public; Owner: crearis_admin
--

ALTER TABLE ONLY public.versions
    ADD CONSTRAINT versions_pkey PRIMARY KEY (id);


--
-- Name: versions versions_version_number_key; Type: CONSTRAINT; Schema: public; Owner: crearis_admin
--

ALTER TABLE ONLY public.versions
    ADD CONSTRAINT versions_version_number_key UNIQUE (version_number);


--
-- Name: idx_record_versions_lookup; Type: INDEX; Schema: public; Owner: crearis_admin
--

CREATE INDEX idx_record_versions_lookup ON public.record_versions USING btree (version_id, record_type, record_id);


--
-- Name: idx_tasks_category; Type: INDEX; Schema: public; Owner: crearis_admin
--

CREATE INDEX idx_tasks_category ON public.tasks USING btree (category);


--
-- Name: idx_tasks_record; Type: INDEX; Schema: public; Owner: crearis_admin
--

CREATE INDEX idx_tasks_record ON public.tasks USING btree (record_type, record_id);


--
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: crearis_admin
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);


--
-- Name: idx_tasks_version; Type: INDEX; Schema: public; Owner: crearis_admin
--

CREATE INDEX idx_tasks_version ON public.tasks USING btree (version_id);


--
-- Name: idx_versions_active; Type: INDEX; Schema: public; Owner: crearis_admin
--

CREATE INDEX idx_versions_active ON public.versions USING btree (is_active);


--
-- Name: events events_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: crearis_admin
--

CREATE TRIGGER events_updated_at_trigger BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: instructors instructors_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: crearis_admin
--

CREATE TRIGGER instructors_updated_at_trigger BEFORE UPDATE ON public.instructors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: locations locations_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: crearis_admin
--

CREATE TRIGGER locations_updated_at_trigger BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: participants participants_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: crearis_admin
--

CREATE TRIGGER participants_updated_at_trigger BEFORE UPDATE ON public.participants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: posts posts_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: crearis_admin
--

CREATE TRIGGER posts_updated_at_trigger BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tasks tasks_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: crearis_admin
--

CREATE TRIGGER tasks_updated_at_trigger BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

GRANT ALL ON SCHEMA public TO crearis_admin;


--
-- PostgreSQL database dump complete
--

